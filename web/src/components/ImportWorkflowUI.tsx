'use client';

import React, { useCallback, useEffect, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Loader2Icon } from 'lucide-react';
import { useNavigate } from "react-router-dom";

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
            return data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'] })
            navigate('/')
        }
    })

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

                <div className='mt-5'>
                    <Button variant="default" disabled={!importJson} onClick={(e) => {
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