'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Loader2Icon, AlertTriangle, Replace, CheckCircle, File } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { MissingModel } from '@/lib/types';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import ImportURLUI from './ImportURLUI';
import HFLogo from './HFLogo';
import { Badge } from "@/components/ui/badge"


// const CW_ENDPOINT = "https://comfyworkflows.com"

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

// const failed_models: FailedModel[] = [
//     {
//         id: "1",
//         file_name: "ip_adapter_image_encoder_pytorch_model.bin",
//         backup_models: [
//             {
//                id: "1",
//                file_name: "ip_adapter_v4.safetensors",
//                link: "https://huggingface.co/h94/IP-Adapter-FaceID",
//                type: "hf" 
//             },
//             {
//                 id: "2",
//                 file_name: "ip_adapter_still.safetensors",
//                 link: "https://huggingface.co/h94/IP-Adapter-FaceID",
//                 type: "hf" 
//             },
//             {
//                 id: "3",
//                 file_name: "ip_adapter_goofy.safetensors",
//                 link: "https://huggingface.co/h94/IP-Adapter-FaceID",
//                 type: "hf" 
//             },
//             {
//                 id: "4",
//                 file_name: "image_encoder_adapter.safetensors",
//                 link: "https://huggingface.co/h94/IP-Adapter-FaceID",
//                 type: "hf" 
//             }
//         ],
//         resolved: true,
//         new_file_name: "ip_adapter_v4.safetensors"
//     },
//     {
//         id: "2",
//         file_name: "nooshpere_4.7.safetensors",
//         backup_models: [
//             {
//                 id: "1",
//                 file_name: "nooshpere_animations.safetensors",
//                 link: "https://huggingface.co/h94/IP-Adapter-FaceID",
//                 type: "hf" 
//             },
//             {
//                 id: "2",
//                 file_name: "noosphere_direct.safetensors",
//                 link: "https://huggingface.co/h94/IP-Adapter-FaceID",
//                 type: "hf" 
//             },
//             {
//                 id: "3",
//                 file_name: "noosphere_v_1_5.ckpt",
//                 link: "https://huggingface.co/h94/IP-Adapter-FaceID",
//                 type: "hf" 
//             }
//         ],
//         resolved: false,
//         new_file_name: ""
//     },
//     {
//         id: "3",
//         file_name: "3Dmeinamix_meinaV11.safetensors'",
//         backup_models: [
//             {
//                 id: "1",
//                 file_name: "meinamix.safetensors",
//                 link: "https://huggingface.co/h94/IP-Adapter-FaceID",
//                 type: "hf" 
//             },
//             {
//                 id: "2",
//                 file_name: "meinav11.safetensors",
//                 link: "https://huggingface.co/h94/IP-Adapter-FaceID",
//                 type: "hf" 
//             }
//         ],
//         resolved: false,
//         new_file_name: ""
//     }
// ]

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
    const [resolvingModelWithID, setResolvingModelWithId] = React.useState("");
    const [skippingMissingModelsWarningOpen, setSkippingMissingModelsWarningOpen] = useState(false);
    const [skippedMissingModels, setSkippedMissingModels] = useState(false);
    const [resolvedAllModels, setResolvedAllModels] = useState(false);

    const importProjectMutation = useMutation({
        mutationFn: async ({ import_json, name }: { import_json: string, name: string }) => {
            const final_import_json = JSON.parse(import_json)
            const response = await fetch(`/api/import_project`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ import_json: final_import_json, name })
            })
            const data = await response.json()
            if (!data.success && data.missing_models?.length > 0) {
                console.log(`SUCCESS fr is false && missing_models length is greater than 0! data.success: ${data.success}. data.missing_models: ${data.missing_models}`)
                setMissingModels(data.missing_models);
            } else {
                navigate('/')
            }
            return data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
    })

    const resolveMissingModelMutationWithBackup = useMutation({
        mutationFn: async ({ id_to_resolve, backup_to_use }: { id_to_resolve: string, backup_to_use: string }) => {
            setResolvingModelWithId(id_to_resolve);
            console.log("resolveMissingModelMutationWithBackup id_to_resolve:", id_to_resolve);
            console.log("resolveMissingModelMutationWithBackup backup_to_use:", backup_to_use);
            const missing_model = missingModels.find((missingModel) => missingModel.id === id_to_resolve);
            const backup_model = missing_model?.backup_models.find((backupModel) => backupModel.id === backup_to_use);
            if (!missing_model || !backup_model || !importJson) {
                toast.error("something went wrong when resolving your model. please try again.")
                return;
            }
            //replace string in importJson (we don't know where it's located but it's somewhere in the string) that matches missing_mode.file_name with backup_model.file_name below
            const updatedJson = importJson.replace(new RegExp(missing_model.file_name, 'g'), backup_model.file_name);
            setImportJson(updatedJson);
            const updatedMissingModels = missingModels.map((missingModel) => {
                if (missingModel.id === id_to_resolve) {
                    return { ...missingModel, resolved: true, new_file_name: backup_model.file_name };
                }
                return missingModel;
            });
            setMissingModels(updatedMissingModels);

            toast.success("successfully resolved")

            return undefined;
        },
        onSuccess: async () => {
            setResolvingModelWithId("");
        }
    })

    const resolveMissingModelMutationWithURL = useMutation({
        mutationFn: async ({ id_to_resolve, url, type }: { id_to_resolve: string, url: string, type: string }) => {
            setResolvingModelWithId(id_to_resolve);
            console.log("resolveMissingModelMutationWithURL id_to_resolve:", id_to_resolve);
            console.log("resolveMissingModelMutationWithURL url:", url);
            console.log("resolveMissingModelMutationWithURL type:", type);
            const missing_model = missingModels.find((missingModel) => missingModel.id === id_to_resolve);
            // const res = await fetch(`${CW_ENDPOINT}/api/get-model-name`, { //what do we do here?
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({ url: url, type: type }),
            // })
            const res = await new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ 
                        json: () => Promise.resolve({ file_name: 'ip-adapter-faceid_sd15_lora.safetensors' })
                    });
                }, 10000); // Simulate 10-second delay
            });
            //@ts-ignore
            const { file_name } = await res.json(); 
            if (!missing_model || !file_name || !importJson) {
                toast.error("something went wrong when resolving your model. please try again.")
                return;
            }
            //replace string in importJson (we don't know where it's located but it's somewhere in the string) that matches missing_mode.file_name with backup_model.file_name below
            const updatedJson = importJson.replace(new RegExp(missing_model.file_name, 'g'), file_name);
            setImportJson(updatedJson);
            const updatedMissingModels = missingModels.map((missingModel) => {
                if (missingModel.id === id_to_resolve) {
                    return { ...missingModel, resolved: true, new_file_name: file_name };
                }
                return missingModel;
            });
            setMissingModels(updatedMissingModels);

            toast.success("successfully resolved")

            return undefined;
        },
        onSuccess: async () => {
            setResolvingModelWithId("");
        }
    })

    useEffect(() => {
        if (missingModels.every((missing_model) => !!missing_model.resolved)) {
            console.log("RESOLVED all missing models")
            setResolvedAllModels(true);
        } else {
            console.log("HAVE NOT RESOLVED all missing models")
            setResolvedAllModels(false);
        }
    }, [missingModels])

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
                        <CardDescription>{resolvedAllModels ? 'Please try importing again.' : 'We could not find the folloiwng models from the workflow you tried to import. Replace missing models with the models that are available to avoid getting errors.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        {missingModels.map((missing_model) => { //iterate through missingModels instead
                            if (!missing_model.resolved) {
                                return (
                                    <div className='w-full flex flex-col items-start gap-4'>
                                        <div className='w-full flex flex-row items-center justify-between'>
                                            <div className='flex flex-row items-center gap-2'>
                                                {resolvingModelWithID === missing_model.id ? <Loader2Icon className=' text-orange-500 animate-spin w-4 h-4' /> : <AlertTriangle className='w-4 h-4 text-red-500' />}
                                                <h3 className='text-white font-bold'>{missing_model.filename}</h3>
                                            </div>
                                        </div>
                                        <div className='w-full flex flex-col items-start gap-4'>
                                            <div className='w-full flex flex-col items-start gap-'>
                                                <div className='flex flex-row items-center gap-2'>
                                                    <Replace className='w-4 h-4 text-green-400' />
                                                    <p className='text-white font-semibold'>Replace with</p>
                                                </div>
                                                {missing_model.suggestions.map((suggestion) => {
                                                    return (
                                                        <div key={suggestion.hf_file_id || suggestion.civitai_file_id} className='w-full flex flex-row items-center justify-between my-1'>
                                                            <div className='flex flex-row items-center space-x-2'>
                                                                {suggestion.source === "civitai" ? <img alt={`civitai logo for model ${suggestion.filename}`} src='/civitai-logo-github.png' className='ph-no-capture w-5 h-5' /> : <HFLogo className='w-5 h-5' />}
                                                                <p className='text-white'>{suggestion.filename}</p>
                                                                {suggestion.filepath && 
                                                                <Badge className='flex flex-row items-center gap-2'>
                                                                    <File className='w-4 h-4' />
                                                                    {suggestion.filepath}
                                                                </Badge>}
                                                            </div>
                                                            <div className='flex flex-row items-center gap-2'>
                                                                <Button
                                                                size='sm'
                                                                className=''
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    resolveMissingModelMutationWithBackup.mutate({ id_to_resolve: missing_model.id, backup_to_use: backup_model.id })
                                                                }}
                                                                >
                                                                    Use this model
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <ImportURLUI failed_model_id={missing_model.id} mutationToUse={resolveMissingModelMutationWithURL} />
                                        </div>
                                        <Separator className='bg-[#444]' />
                                    </div>
                                )
                            } else {
                                return (
                                    <div className='w-full flex flex-row items-center justify-between'>
                                        <div className='flex flex-row items-center gap-2'>
                                            <CheckCircle className='w-4 h-4 text-green-400' />
                                            <h3 className='text-white font-bold'>{failed_model.new_file_name}</h3>
                                            <h3 className='text-[#999] font-bold line-through ml-2'>{failed_model.file_name}</h3>
                                        </div>
                                        <Button 
                                        size='sm'
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const updatedMissingModels = missingModels.map((missingModel) => {
                                                if (missingModel.id === failed_model.id) {
                                                    return { ...missingModel, resolved: false, new_file_name: "" };
                                                }
                                                return missingModel;
                                            });
                                            setMissingModels(updatedMissingModels);
                                        }}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                )
                            }
                        })}
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
                    <Button variant="default" disabled={!importJson || (missingModels.length > 0 && !resolvedAllModels && !skippedMissingModels)} onClick={(e) => {
                        e.preventDefault();
                        if (!importJson) return;
                        setImportProjectDialogOpen(true);
                    }}>Import</Button>
                </div>
            </div>
        </>
    )
}

export default ImportWorkflowUI