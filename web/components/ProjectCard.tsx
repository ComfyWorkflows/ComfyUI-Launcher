"use client";

import { Project } from '@/lib/types';
import { Button } from './ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2Icon, LoaderIcon } from 'lucide-react';
import { DialogDescription } from '@radix-ui/react-dialog';

type ProjectCardProps = {
    item: Project;
}

function ProjectCard({ item }: ProjectCardProps) {
    const queryClient = useQueryClient()

    const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = React.useState(false)

    const [projectOperation, setProjectOperation] = React.useState<'launch' | 'stop' | 'delete'>();
    const [projectStatusDialogOpen, setProjectStatusDialogOpen] = React.useState(false)

    const launchProjectMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/projects/${item.id}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            const data = await response.json()
            return data
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
    })

    const stopProjectMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/projects/${item.id}/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            const data = await response.json()
            return data
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
    })

    const deleteProjectMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/projects/${item.id}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            const data = await response.json()
            return data
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
    })

    useEffect(() => {
        if (launchProjectMutation.isPending) {
            setProjectOperation('launch')
        }
        else if (deleteProjectMutation.isPending) {
            setProjectOperation('delete')
        }
        else if (stopProjectMutation.isPending) {
            setProjectOperation('stop')
        } else {
            setProjectOperation(undefined)
        }
        setProjectStatusDialogOpen(launchProjectMutation.isPending || stopProjectMutation.isPending || deleteProjectMutation.isPending);
    }, [launchProjectMutation.isPending, stopProjectMutation.isPending, deleteProjectMutation.isPending])


    return (
        <>
            <Dialog onOpenChange={(open) => setProjectStatusDialogOpen(open)} open={!!projectOperation && projectStatusDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        {projectOperation === "launch" && <DialogTitle>Launching project...</DialogTitle>}
                        {projectOperation === "stop" && <DialogTitle>Stopping project...</DialogTitle>}
                        {projectOperation === "delete" && <DialogTitle>Deleting project...</DialogTitle>}
                        <DialogDescription className='mt-5 text-sm text-neutral-700 font-medium'>This could take a few moments.</DialogDescription>
                    </DialogHeader>
                    <div className='flex justify-center items-center'>
                        <Loader2Icon className="animate-spin h-10 w-10 text-gray-700" />
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog open={deleteProjectDialogOpen} onOpenChange={(open) => setDeleteProjectDialogOpen(open)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            project's data.

                            Your models will NOT be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => {
                            e.preventDefault();
                            setDeleteProjectDialogOpen(false);
                            deleteProjectMutation.mutate()
                        }}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className={"rounded-md  p-5 border " + 'bg-gray-100 hover:bg-gray-200 border-gray-300'}>
                <div className='flex flex-col space-y-5'>
                    <div className='flex flex-col'>
                        <h1 className="text-lg font-semibold">{item.state.name}</h1>
                        <p className="mt-1 font-medium text-xs text-gray-500 font-mono">ID: {item.id}</p>
                    </div>
                    <div className='flex flex-row space-x-2'>
                        {item.state.state === "ready" && <Button onClick={(e) => {
                            e.preventDefault();
                            launchProjectMutation.mutate()
                        }} variant="default">Launch</Button>}
                        {item.state.state === "running" && !!item.state.port && <Button variant="default" asChild>
                            <Link href={`http://localhost:${item.state.port}`} target='_blank'>Open</Link>
                        </Button>}
                        {item.state.state === "running" && <Button onClick={(e) => {
                            e.preventDefault();
                            stopProjectMutation.mutate()
                        }} variant="secondary">Stop</Button>}
                        {(item.state.state === "ready" || item.state.state === "running") && <Button onClick={(e) => {
                            e.preventDefault();
                            setDeleteProjectDialogOpen(true);
                        }} variant="destructive">Delete</Button>}
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProjectCard