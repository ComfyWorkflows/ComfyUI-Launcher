'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, WorkflowTemplateId, WorkflowTemplateItem } from '@/lib/types'
import { DialogDescription } from '@radix-ui/react-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLinkIcon, Loader2Icon } from 'lucide-react'
import React, { useEffect } from 'react'
import { Button } from './ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { useNavigate } from 'react-router-dom'
import { Checkbox } from './ui/checkbox'

type WorkflowTemplateProps = {
    item: WorkflowTemplateItem
    settings: Settings
}

function WorkflowTemplate({
    item: { id, title, description, thumbnail, isThumbnailVideo, credits },
    settings,
}: WorkflowTemplateProps) {
    const isSelected = false // selectedAppId === id;
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const createProjectMutation = useMutation({
        mutationFn: async ({
            template_id,
            name,
            useFixedPort,
            port,
        }: {
            template_id: WorkflowTemplateId
            name: string
            useFixedPort: boolean
            port: number
        }) => {
            const response = await fetch(`/api/create_project`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_id,
                    name,
                    port: useFixedPort ? port : undefined,
                }),
            })
            const data = await response.json()
            return data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'] })
            navigate('/')
        },
    })

    const [projectName, setProjectName] = React.useState('')
    const [useFixedPort, setUseFixedPort] = React.useState(false)
    const [fixedPort, setFixedPort] = React.useState(4001)

    const [createProjectDialogOpen, setCreateProjectDialogOpen] =
        React.useState(false)
    const [projectStatusDialogOpen, setProjectStatusDialogOpen] =
        React.useState(false)

    useEffect(() => {
        setProjectStatusDialogOpen(createProjectMutation.isPending)
    }, [createProjectMutation.isPending])

    return (
        <>
            <Dialog
                onOpenChange={(open) => setCreateProjectDialogOpen(open)}
                open={createProjectDialogOpen}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create project</DialogTitle>
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

                        {(settings.ALLOW_OVERRIDABLE_PORTS_PER_PROJECT === true) && (
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
                                            min={settings.PROJECT_MIN_PORT}
                                            max={settings.PROJECT_MAX_PORT}
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
                                createProjectMutation.mutate({
                                    template_id: id,
                                    name: projectName,
                                    useFixedPort,
                                    port: fixedPort,
                                })
                                setCreateProjectDialogOpen(false)
                            }}
                        >
                            Create
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
                        <DialogTitle>Creating project...</DialogTitle>
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

            <div
                className={
                    'rounded-md  p-5 border ' +
                    (isSelected
                        ? 'border-2 border-blue-500 hover:bg-gray-200'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-300')
                }
            >
                <div className="flex flex-row justify-between space-x-5">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-semibold">{title}</h1>
                        <p className="mt-1 font-medium text-sm text-gray-500">
                            {description}
                        </p>
                    </div>
                    <div className="flex flex-col">
                        <Button
                            onClick={(e) => {
                                e.preventDefault()
                                setCreateProjectDialogOpen(true)
                            }}
                            variant="default"
                        >
                            Create
                        </Button>
                    </div>
                </div>
                {thumbnail && !isThumbnailVideo && (
                    <img src={thumbnail} className="mt-4 w-full rounded-md" />
                )}
                {thumbnail && isThumbnailVideo && (
                    <video
                        muted
                        loop
                        autoPlay
                        src={thumbnail}
                        className="mt-4 w-full rounded-md"
                    />
                )}
                {credits && (
                    <a href={credits} target="_blank">
                        <div className="mt-5 text-xs font-medium text-gray-500 flex items-center">
                            Credits{' '}
                            <ExternalLinkIcon className="ml-1 w-3 h-3" />
                        </div>
                    </a>
                )}
            </div>
        </>
    )
}

export default WorkflowTemplate
