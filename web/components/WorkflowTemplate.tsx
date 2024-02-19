"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkflowTemplateId, WorkflowTemplateItem } from '@/lib/types';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLinkIcon, Loader2Icon, LoaderIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

type WorkflowTemplateProps = {
    item: WorkflowTemplateItem;
}

function WorkflowTemplate({ item: { id, title, description, thumbnail, isThumbnailVideo, credits } }: WorkflowTemplateProps) {
    const isSelected = false; // selectedAppId === id;
    const queryClient = useQueryClient()
    const router = useRouter()

    const createProjectMutation = useMutation({
        mutationFn: async ({ template_id, name }: { template_id: WorkflowTemplateId, name: string }) => {
            const response = await fetch(`/api/create_project`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ template_id, name })
            })
            const data = await response.json()
            return data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'] })
            router.push('/')
        }
    })

    const [projectName, setProjectName] = React.useState('')
    const [createProjectDialogOpen, setCreateProjectDialogOpen] = React.useState(false)
    const [projectStatusDialogOpen, setProjectStatusDialogOpen] = React.useState(false)

    useEffect(() => {
        setProjectStatusDialogOpen(createProjectMutation.isPending);
    }, [createProjectMutation.isPending])

    return (
        <>
            <Dialog onOpenChange={(open) => setCreateProjectDialogOpen(open)} open={createProjectDialogOpen}>
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
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={(e) => {
                            e.preventDefault();
                            createProjectMutation.mutate({ template_id: id, name: projectName })
                            setCreateProjectDialogOpen(false);
                        }}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog onOpenChange={(open) => setProjectStatusDialogOpen(open)} open={projectStatusDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Creating project...</DialogTitle>
                        <DialogDescription>Setting up ComfyUI, installing custom nodes, downloading models</DialogDescription>
                    </DialogHeader>
                    <div className='flex justify-center items-center'>
                        <Loader2Icon className="animate-spin h-10 w-10 text-gray-700" />
                    </div>
                </DialogContent>
            </Dialog>

            <div className={"rounded-md  p-5 border " + ((isSelected) ? 'border-2 border-blue-500 hover:bg-gray-200' : 'bg-gray-100 hover:bg-gray-200 border-gray-300')}>
                <div className='flex flex-row justify-between space-x-5'>
                    <div className='flex flex-col'>
                        <h1 className="text-lg font-semibold">{title}</h1>
                        <p className="mt-1 font-medium text-sm text-gray-500">{description}</p>
                    </div>
                    <div className='flex flex-col'>
                        <Button onClick={(e) => {
                            e.preventDefault();
                            setCreateProjectDialogOpen(true);
                        }} variant="default">Create</Button>
                    </div>
                </div>
                {thumbnail && !isThumbnailVideo && <img src={thumbnail} className="mt-4 w-full rounded-md" />}
                {thumbnail && isThumbnailVideo && <video muted loop autoPlay src={thumbnail} className="mt-4 w-full rounded-md" />}
                {credits && <a href={credits} target='_blank'><div className='mt-5 text-xs font-medium text-gray-500 flex items-center'>
                    Credits <ExternalLinkIcon className='ml-1 w-3 h-3' />
                </div></a>}
            </div >
        </>
    )
}

export default WorkflowTemplate