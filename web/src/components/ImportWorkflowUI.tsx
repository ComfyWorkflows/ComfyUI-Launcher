'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from './ui/button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Loader2Icon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    MissingModel,
    ResolvedMissingModelFile,
    Settings,
    Source,
} from '@/lib/types'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import MissingModelItem from './MissingModelItem'
import { Checkbox } from './ui/checkbox'

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
    transition: 'border .24s ease-in-out',
}

const focusedStyle = {
    borderColor: '#2196f3',
}

const acceptStyle = {
    borderColor: '#00e676',
}

const rejectStyle = {
    borderColor: '#ff1744',
}

function ImportWorkflowUI() {
    const [isServerSide, setIsServerSide] = React.useState(true)
    const [importJson, setImportJson] = React.useState<string>()

    const queryClient = useQueryClient()
    const navigate = useNavigate()

    React.useEffect(() => {
        setIsServerSide(false)
    }, [])

    const getSettingsQuery = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const response = await fetch(`/api/settings`)
            const data = await response.json()
            return data as Settings
        },
    })

    const [projectName, setProjectName] = React.useState('')
    const [importProjectDialogOpen, setImportProjectDialogOpen] =
        React.useState(false)
    const [projectStatusDialogOpen, setProjectStatusDialogOpen] =
        React.useState(false)
    const [useFixedPort, setUseFixedPort] = React.useState(false)
    const [fixedPort, setFixedPort] = React.useState(4001)

    const [missingModels, setMissingModels] = React.useState<MissingModel[]>([])
    const [resolvedMissingModels, setResolvedMissingModels] = React.useState<
        ResolvedMissingModelFile[]
    >([])
    const [resolvedAllModels, setResolvedAllModels] = useState(false)
    const [
        confirmOnlyPartiallyResolvingOpen,
        setConfirmOnlyPartiallyResolvingOpen,
    ] = useState(false)

    const importProjectMutation = useMutation({
        mutationFn: async ({
            import_json,
            name,
            partiallyResolved,
            useFixedPort,
            port,
        }: {
            import_json: string
            name: string
            partiallyResolved?: boolean
            useFixedPort: boolean
            port: number
        }) => {
            const final_import_json = JSON.parse(import_json)
            const uniqueFilenames = new Set()
            const uniqueResolvedMissingModels = resolvedMissingModels.filter(
                (model) => {
                    if (uniqueFilenames.has(model.filename)) {
                        return false
                    }
                    uniqueFilenames.add(model.filename)
                    return true
                }
            )

            const partiallyResolvedBool = partiallyResolved ? true : false
            const response = await fetch(`/api/import_project`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    import_json: final_import_json,
                    resolved_missing_models: uniqueResolvedMissingModels,
                    skipping_model_validation: partiallyResolvedBool,
                    name,
                    useFixedPort,
                    port: useFixedPort ? port : undefined,
                }),
            })
            const data = await response.json()
            if (!data.success && data.missing_models?.length > 0) {
                setMissingModels(data.missing_models)
            } else if (!data.success && !!data.error) {
                console.error('error importing workflow:', data.error)
                toast.error(data.error)
            } else {
                navigate('/')
            }
            return data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'] })
        },
    })

    const resolveMissingModelMutationWithSuggestion = useMutation({
        mutationFn: async ({
            filename,
            node_type,
            dest_relative_path,
            source,
        }: {
            filename: string
            node_type: string
            dest_relative_path: string
            source: Source
        }) => {
            if (!filename || !node_type || !source) {
                toast.error(
                    'something went wrong when resolving your model. please try again.'
                )
                return
            }

            try {
                // const newItem = { filename: filename, node_type: node_type, source: source };
                // const newSet = new Set(resolvedMissingModels);
                // newSet.add(newItem);
                // setResolvedMissingModels(newSet);
                setResolvedMissingModels([
                    ...resolvedMissingModels,
                    {
                        filename: filename,
                        node_type: node_type,
                        dest_relative_path: dest_relative_path,
                        source: source,
                    },
                ])
            } catch (error: unknown) {
                toast.error(
                    'something went wrong when resolving your model. please try again.'
                )
                return
            }

            toast.success('successfully resolved')

            return
        },
    })

    const unResolveMissingModelMutationWithSuggestion = useMutation({
        mutationFn: async ({ filename }: { filename: string }) => {
            if (!filename) {
                toast.error(
                    'something went wrong when attempting to edit your model. please try again.'
                )
                return
            }

            try {
                // const itemToRemove = { filename: "example", node_type: "example" };
                // const updatedSet = new Set([...resolvedMissingModels].filter(item => item !== itemToRemove));
                // setResolvedMissingModels(updatedSet);
                setResolvedMissingModels(
                    resolvedMissingModels.filter(
                        (missingModel) => missingModel.filename !== filename
                    )
                )
            } catch (error: unknown) {
                toast.error(
                    'something went wrong when attempting to edit your model. please try again.'
                )
                return
            }

            // toast.success("successfully resolved")

            return
        },
    })

    useEffect(() => {
        if (
            missingModels.length > 0 &&
            resolvedMissingModels.length > 0 &&
            missingModels.length === resolvedMissingModels.length
        ) {
            console.log('RESOLVED all missing models')
            setResolvedAllModels(true)
        } else {
            console.log('HAVE NOT RESOLVED all missing models')
            setResolvedAllModels(false)
        }
    }, [missingModels, resolvedMissingModels])

    useEffect(() => {
        setProjectStatusDialogOpen(importProjectMutation.isPending)
        if (importProjectMutation.isPending) {
            setConfirmOnlyPartiallyResolvingOpen(false)
        }
    }, [importProjectMutation.isPending])

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) {
                setImportJson(undefined)
                return
            }
            acceptedFiles.slice(0, 1).forEach((file) => {
                const reader = new FileReader()
                reader.onabort = () => console.log('file reading was aborted')
                reader.onerror = () => console.log('file reading has failed')
                reader.onload = () => {
                    // Do whatever you want with the file contents
                    const binaryStr = reader.result // string | ArrayBuffer | null
                    if (!binaryStr) {
                        setImportJson(undefined)
                        return
                    }
                    if (typeof binaryStr === 'string') {
                        setImportJson(binaryStr)
                    } else {
                        const bytes = new Uint8Array(binaryStr)
                        const arr = []
                        for (var i = 0; i < bytes.length; i++) {
                            arr.push(String.fromCharCode(bytes[i]))
                        }
                        const bstr = arr.join('')
                        setImportJson(bstr)
                    }
                }
                reader.readAsArrayBuffer(file)
            })
        },
        [setImportJson]
    )

    const {
        acceptedFiles,
        getRootProps,
        getInputProps,
        isFocused,
        isDragAccept,
        isDragReject,
    } = useDropzone({ onDrop, accept: { 'application/json': [] }, maxFiles: 1 })

    const style = useMemo(
        () => ({
            ...baseStyle,
            ...(isFocused ? focusedStyle : {}),
            ...(isDragAccept ? acceptStyle : {}),
            ...(isDragReject ? rejectStyle : {}),
        }),
        [isFocused, isDragAccept, isDragReject]
    )

    useEffect(() => {
        // if settings are loaded and the ALLOW_OVERRIDABLE_PORTS_PER_PROJECT is set to false,
        // then we should not allow the user to specify a fixed port
        if (getSettingsQuery.data) {
            if (!getSettingsQuery.data.ALLOW_OVERRIDABLE_PORTS_PER_PROJECT) {
                setUseFixedPort(false)
            }
        }
    }, [getSettingsQuery.data])

    if (isServerSide) {
        return
    }

    if (getSettingsQuery.isLoading) {
        return <div>Loading...</div>
    }

    return (
        <>
            <Dialog
                onOpenChange={(open) => setImportProjectDialogOpen(open)}
                open={importProjectDialogOpen}
            >
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

                        {(getSettingsQuery.data
                            ?.ALLOW_OVERRIDABLE_PORTS_PER_PROJECT === true) && (
                            <>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label
                                        htmlFor="useFixedPort"
                                        className="text-sm"
                                    >
                                        Use a static port
                                    </Label>
                                    <Checkbox
                                        id="useFixedPort"
                                        checked={useFixedPort}
                                        onCheckedChange={(checked) => {
                                            // @ts-ignore
                                            setUseFixedPort(checked)
                                        }}
                                    />
                                </div>
                                {useFixedPort && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label
                                            htmlFor="port"
                                            className="text-right"
                                        >
                                            Port
                                        </Label>
                                        <Input
                                            id="port"
                                            type="number"
                                            required={useFixedPort}
                                            min={getSettingsQuery.data.PROJECT_MIN_PORT}
                                            max={getSettingsQuery.data.PROJECT_MAX_PORT}
                                            placeholder=""
                                            // className="col-span-3"
                                            value={fixedPort}
                                            onChange={(e) =>
                                                setFixedPort(
                                                    parseInt(e.target.value)
                                                )
                                            }
                                        />
                                    </div>
                                )}
                                {useFixedPort && (
                                    <div className="grid grid-cols-1 items-center gap-4">
                                        <p className="text-xs text-neutral-500">
                                            If you're using Docker or running
                                            this on a remote server, make sure
                                            that the port number you chose
                                            satisfies any necessary
                                            port-forwarding rules.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            onClick={(e) => {
                                e.preventDefault()
                                if (!importJson) return
                                importProjectMutation.mutate({
                                    import_json: importJson,
                                    name: projectName,
                                    useFixedPort,
                                    port: fixedPort,
                                })
                                setImportProjectDialogOpen(false)
                            }}
                        >
                            Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                onOpenChange={(open) => setProjectStatusDialogOpen(open)}
                open={projectStatusDialogOpen}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Importing project...</DialogTitle>
                        <DialogDescription>
                            Setting up ComfyUI, installing custom nodes,
                            downloading models. This might take a few minutes.
                            Do not close this page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center items-center">
                        <Loader2Icon className="animate-spin h-10 w-10 text-gray-700" />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                onOpenChange={(open) =>
                    setConfirmOnlyPartiallyResolvingOpen(open)
                }
                open={confirmOnlyPartiallyResolvingOpen}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            Are you sure you want to skip resolving all models?
                        </DialogTitle>
                        <DialogDescription>
                            You will probably face errors when running the
                            workflow in ComfyUI and might have to upload
                            replacement models to run the workflow.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={(e) => {
                                e.preventDefault()
                                setConfirmOnlyPartiallyResolvingOpen(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.preventDefault()
                                if (!importJson) return
                                importProjectMutation.mutate({
                                    import_json: importJson,
                                    name: projectName,
                                    partiallyResolved: true,
                                    useFixedPort,
                                    port: fixedPort,
                                })
                            }}
                        >
                            Yes, skip
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col p-10">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-semibold">Import workflow</h1>
                    <p className="mt-5 font-medium text-gray-700">
                        Drag & drop a <b>ComfyUI workflow json file</b> or{' '}
                        <b>ComfyUI Launcher json file</b> to run it with{' '}
                        <b>ZERO setup</b>.
                    </p>
                </div>

                <div className="flex flex-col mt-10">
                    {/* @ts-ignore */}
                    <div
                        className="cursor-pointer"
                        //  @ts-ignore
                        {...getRootProps({ style })}
                    >
                        <input {...getInputProps()} />
                        <p>Drag & drop your json file here</p>
                    </div>
                    <aside className="mt-4">
                        <ul>
                            {acceptedFiles.slice(0, 1).map((file) => (
                                <li
                                    className="font-medium text-sm"
                                    key={file.name}
                                >
                                    {file.name} - {file.size} bytes
                                </li>
                            ))}
                        </ul>
                    </aside>
                </div>

                {missingModels.length > 0 && (
                    <Card className="bg-[#0a0a0a] backdrop-blur-xl border-2 border-[#444] w-full">
                        <CardHeader>
                            <CardTitle className="text-white">
                                {resolvedAllModels
                                    ? 'All unrecognized models have been resolved.'
                                    : 'These models were not recognized'}
                            </CardTitle>
                            <CardDescription className="text-[#999]">
                                {resolvedAllModels
                                    ? 'Please try importing again.'
                                    : 'Replace missing models with the models that are available to avoid getting errors.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6 space-y-5">
                            {missingModels.map((missing_model) => {
                                //iterate through missingModels instead
                                return (
                                    <MissingModelItem
                                        key={`${missing_model.filename}_${missing_model.node_type}_${missing_model.dest_relative_path}`}
                                        missingModel={missing_model}
                                        resolveMutationToUse={
                                            resolveMissingModelMutationWithSuggestion
                                        }
                                        unResolveMutationToUse={
                                            unResolveMissingModelMutationWithSuggestion
                                        }
                                    />
                                )
                            })}
                        </CardContent>
                    </Card>
                )}

                <div className="mt-5">
                    <Button
                        variant="default"
                        disabled={!importJson}
                        onClick={(e) => {
                            e.preventDefault()
                            if (!importJson) return
                            if (
                                missingModels.length > 0 &&
                                !resolvedAllModels
                            ) {
                                setConfirmOnlyPartiallyResolvingOpen(true)
                            } else {
                                setImportProjectDialogOpen(true)
                            }
                        }}
                    >
                        Import
                    </Button>
                </div>
            </div>
        </>
    )
}

export default ImportWorkflowUI
