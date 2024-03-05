'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Loader2Icon } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { MissingModel, ResolvedMissingModelFile, Source } from '@/lib/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import MissingModelItem from './MissingModelItem';


const baseStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderWidth: 2,
    borderRadius: 2,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out'
};

const focusedStyle = {
    borderColor: '#2196f3'
};

const acceptStyle = {
    borderColor: '#00e676'
};

const rejectStyle = {
    borderColor: '#ff1744'
};


function ImportWorkflowUI() {
    const [isServerSide, setIsServerSide] = React.useState(true)
    const [importJson, setImportJson] = React.useState<string>();

    const queryClient = useQueryClient()
    const navigate = useNavigate();

    React.useEffect(() => {
        setIsServerSide(false)
    }, [])

    const [projectName, setProjectName] = React.useState('')
    const [importProjectDialogOpen, setImportProjectDialogOpen] = React.useState(false)
    const [projectStatusDialogOpen, setProjectStatusDialogOpen] = React.useState(false)

    const [missingModels, setMissingModels] = React.useState<MissingModel[]>([]);
    const [resolvedMissingModels, setResolvedMissingModels] = React.useState<ResolvedMissingModelFile[]>([]);
    // const [resolvedMissingModels, setResolvedMissingModels] = React.useState(new Set<ResolvedMissingModelFile>());
    const [skippingMissingModelsWarningOpen, setSkippingMissingModelsWarningOpen] = useState(false);
    const [skippedMissingModels, setSkippedMissingModels] = useState(false);
    const [resolvedAllModels, setResolvedAllModels] = useState(false);
    const [confirmOnlyPartiallyResolvingOpen, setConfirmOnlyPartiallyResolvingOpen] = useState(false);

    const importProjectMutation = useMutation({
        mutationFn: async ({ import_json, name, partiallyResolved }: { import_json: string, name: string, partiallyResolved?: boolean }) => {
            console.log("importProjectMutation. entered function!")
            const final_import_json = JSON.parse(import_json)
            const uniqueFilenames = new Set();
            const uniqueResolvedMissingModels = resolvedMissingModels.filter((model) => {
                if (uniqueFilenames.has(model.filename)) {
                    return false;
                }
                uniqueFilenames.add(model.filename);
                return true;
            });
            console.log("importProjectMutation final_import_json:", final_import_json);
            console.log("importProjectMutation uniqueResolvedMissingModels:", uniqueResolvedMissingModels);
            console.log("importProjectMutation skippedMissingModels:", skippedMissingModels);
            console.log("importProjectMutation name:", name);
            const partiallyResolvedBool = partiallyResolved ? true : false;
            console.log("importProjectMutation partiallyResolvedBool:", partiallyResolvedBool);
            const response = await fetch(`/api/import_project`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ import_json: final_import_json, resolved_missing_models: uniqueResolvedMissingModels, skipping_model_validation: skippedMissingModels || partiallyResolvedBool, name })
            })
            const data = await response.json()
            console.log("DATA:", data);
            if (!data.success && data.missing_models?.length > 0) {
                console.log(`SUCCESS fr is false && missing_models length is greater than 0! data.success: ${data.success}. data.missing_models: ${data.missing_models}`)
                toast.error(data.error);
                setMissingModels(data.missing_models);
            } else if (!data.success && !!data.error) {
                toast.error(data.error);
            } else {
                navigate('/')
            }
            return data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
    })

    const resolveMissingModelMutationWithSuggestion = useMutation({
        mutationFn: async ({ filename, node_type, source }: { filename: string, node_type: string, source: Source }) => {
            if (!filename || !node_type || !source) {
                toast.error("something went wrong when resolving your model. please try again.");
                return;
            }
            
            try {
                // const newItem = { filename: filename, node_type: node_type, source: source };
                // const newSet = new Set(resolvedMissingModels);
                // newSet.add(newItem);
                // setResolvedMissingModels(newSet);
                setResolvedMissingModels([...resolvedMissingModels, { filename: filename, node_type: node_type, source: source }]);
            } catch (error: unknown) {
                toast.error("something went wrong when resolving your model. please try again.");
                return;
            }

            toast.success("successfully resolved")

            return;
        }
    })

    const unResolveMissingModelMutationWithSuggestion = useMutation({
        mutationFn: async ({ filename }: { filename: string }) => {
            if (!filename) {
                toast.error("something went wrong when attempting to edit your model. please try again.");
                return;
            }
            
            try {
                // const itemToRemove = { filename: "example", node_type: "example" };
                // const updatedSet = new Set([...resolvedMissingModels].filter(item => item !== itemToRemove));
                // setResolvedMissingModels(updatedSet);
                setResolvedMissingModels(resolvedMissingModels.filter((missingModel) => missingModel.filename !== filename));
            } catch (error: unknown) {
                toast.error("something went wrong when attempting to edit your model. please try again.");
                return;
            }

            // toast.success("successfully resolved")

            return;
        }
    })

    useEffect(() => {
        if (missingModels.length > 0 && resolvedMissingModels.length > 0 && missingModels.length === resolvedMissingModels.length) {
            console.log("RESOLVED all missing models")
            setResolvedAllModels(true);
        } else {
            console.log("HAVE NOT RESOLVED all missing models")
            setResolvedAllModels(false);
        }
    }, [missingModels, resolvedMissingModels])

    useEffect(() => {
        setProjectStatusDialogOpen(importProjectMutation.isPending);
    }, [importProjectMutation.isPending])


    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) {
            setImportJson(undefined);
            return;
        }
        acceptedFiles.slice(0, 1).forEach((file) => {
            const reader = new FileReader()
            reader.onabort = () => console.log('file reading was aborted')
            reader.onerror = () => console.log('file reading has failed')
            reader.onload = () => {
                // Do whatever you want with the file contents
                const binaryStr = reader.result // string | ArrayBuffer | null
                if (!binaryStr) {
                    setImportJson(undefined);
                    return;
                }
                if (typeof binaryStr === 'string') {
                    setImportJson(binaryStr);
                } else {
                    const bytes = new Uint8Array(binaryStr)
                    const arr = []
                    for (var i = 0; i < bytes.length; i++) {
                        arr.push(String.fromCharCode(bytes[i]))
                    }
                    const bstr = arr.join('')
                    setImportJson(bstr);
                }
            }
            reader.readAsArrayBuffer(file)
        })
    }, [setImportJson])

    const {
        acceptedFiles,
        getRootProps,
        getInputProps,
        isFocused,
        isDragAccept,
        isDragReject
    } = useDropzone({ onDrop, accept: { 'application/json': [] }, maxFiles: 1 });

    const style = useMemo(() => ({
        ...baseStyle,
        ...(isFocused ? focusedStyle : {}),
        ...(isDragAccept ? acceptStyle : {}),
        ...(isDragReject ? rejectStyle : {})
    }), [
        isFocused,
        isDragAccept,
        isDragReject
    ]);


    if (isServerSide) {
        return
    }
    return (
        <>
            <Dialog onOpenChange={(open) => setImportProjectDialogOpen(open)} open={importProjectDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Import project</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                placeholder=""
                                className="col-span-3"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={(e) => {
                            e.preventDefault();
                            if (!importJson) return;
                            importProjectMutation.mutate({ import_json: importJson, name: projectName })
                            setImportProjectDialogOpen(false);
                        }}>Import</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog onOpenChange={(open) => setProjectStatusDialogOpen(open)} open={projectStatusDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Importing project...</DialogTitle>
                        <DialogDescription>Setting up ComfyUI, installing custom nodes, downloading models</DialogDescription>
                    </DialogHeader>
                    <div className='flex justify-center items-center'>
                        <Loader2Icon className="animate-spin h-10 w-10 text-gray-700" />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog onOpenChange={(open) => setSkippingMissingModelsWarningOpen(open)} open={skippingMissingModelsWarningOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to skip fixing unresolved models?</DialogTitle>
                        <DialogDescription>You will probably face errors when running the workflow and might have to upload replacement models to run the workflow.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={(e) => {
                            e.preventDefault();
                            setSkippingMissingModelsWarningOpen(false);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={(e) => {
                            e.preventDefault();
                            setSkippedMissingModels(true);
                            setSkippingMissingModelsWarningOpen(false);
                        }}>
                            Yes, skip
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog onOpenChange={(open) => setConfirmOnlyPartiallyResolvingOpen(open)} open={confirmOnlyPartiallyResolvingOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>You've only partially resolved the missing models, are you sure you want to continue?</DialogTitle>
                        <DialogDescription>You will probably face errors when running the workflow in ComfyUI and might have to upload replacement models to run the workflow.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={(e) => {
                            e.preventDefault();
                            setConfirmOnlyPartiallyResolvingOpen(false);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={(e) => {
                            e.preventDefault();
                            if (!importJson) return;
                            importProjectMutation.mutate({ import_json: importJson, name: projectName, partiallyResolved: true })
                        }}>
                            Yes, import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <div className="flex flex-col p-10">
                <div className='flex flex-col'>
                    <h1 className="text-3xl font-semibold">Import workflow</h1>
                    <p className="mt-5 font-medium text-gray-700">Drag & drop a <b>ComfyUI workflow json file</b> or <b>ComfyUI Launcher json file</b> to run it with <b>ZERO setup</b>.</p>
                </div>

                <div className="flex flex-col mt-10">
                    {/* @ts-ignore */}
                    <div className='cursor-pointer' {...getRootProps({ style })}>
                        <input {...getInputProps()} />
                        <p>Drag & drop your json file here</p>
                    </div>
                    <aside className='mt-4'>
                        <ul>
                            {acceptedFiles.slice(0, 1).map(file => (
                                <li className='font-medium text-sm' key={file.name}>
                                    {file.name} - {file.size} bytes
                                </li>
                            ))}
                        </ul>
                    </aside>
                </div>

                {missingModels.length > 0 && !skippedMissingModels &&
                <Card className="bg-[#0a0a0a] backdrop-blur-xl border-2 border-[#444] w-full" >
                    <CardHeader>
                        <CardTitle className='text-white'>{resolvedAllModels ? 'All unrecognized models have been resolved.' : 'These models were not recognized'}</CardTitle>
                        <CardDescription className='text-[#999]'>{resolvedAllModels ? 'Please try importing again.' : 'Replace missing models with the models that are available to avoid getting errors.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 space-y-5">
                        {missingModels.map((missing_model) => { //iterate through missingModels instead
                        return (
                            <MissingModelItem key={`${missing_model.filename}_${missing_model.node_type}_${missing_model.dest_relative_path}`} missingModel={missing_model} resolveMutationToUse={resolveMissingModelMutationWithSuggestion} unResolveMutationToUse={unResolveMissingModelMutationWithSuggestion} />
                        )})}
                    </CardContent>
                    {!resolvedAllModels &&
                    <CardFooter>
                        <Button onClick={(e) => {
                            e.preventDefault();
                            setSkippingMissingModelsWarningOpen(true);
                        }}>
                            Skip
                        </Button>
                    </CardFooter>}
                </Card>}


                <div className='mt-5'>
                    <Button variant="default" disabled={!importJson || (missingModels.length > 0 && resolvedMissingModels.length === 0 && !skippedMissingModels)} onClick={(e) => {
                        e.preventDefault();
                        if (!importJson) return;
                        if (missingModels.length > 0 && !resolvedAllModels) {
                            setConfirmOnlyPartiallyResolvingOpen(true);
                        } else {
                            setImportProjectDialogOpen(true);
                        }
                    }}>Import</Button>
                </div>
            </div>
        </>
    )
}

export default ImportWorkflowUI