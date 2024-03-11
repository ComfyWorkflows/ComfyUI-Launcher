'use client'

import WorkflowTemplate from './WorkflowTemplate'
import { Masonry } from 'masonic'
import { Settings, WorkflowTemplateItem } from '@/lib/types'
import animateDiffThumbnail from '@/assets/workflow_templates/animate_diff/thumbnail.webp'
import svdThumbnail from '@/assets/workflow_templates/svd/thumbnail.webp'
import upscaleThumbnail from '@/assets/workflow_templates/upscale/thumbnail.webp'
import img2imgThumbnail from '@/assets/workflow_templates/img2img/thumbnail.webp'
import vid2vidThumbnail from '@/assets/workflow_templates/vid2vid/thumbnail.webp'
import img2vidThumbnail from '@/assets/workflow_templates/img2vid_svd/thumbnail.webp'
import { useQuery } from '@tanstack/react-query'

const workflowTemplates: WorkflowTemplateItem[] = [
    {
        id: 'empty',
        title: 'Empty',
        description: 'Blank new ComfyUI project',
        thumbnail: '',
    },
    {
        id: 'animate_diff',
        title: 'AnimateDiff',
        description: 'Create animations from a prompt',
        thumbnail: animateDiffThumbnail,
        credits:
            'https://comfyworkflows.com/workflows/cc4b1b3f-735a-4e22-b241-148606544301',
    },
    {
        id: 'svd',
        title: 'Stable Video Diffusion',
        description: 'Create videos from a prompt',
        thumbnail: svdThumbnail,
        credits:
            'https://comfyworkflows.com/workflows/ae9275b2-c303-48fb-a539-13451dd93808',
    },
    {
        id: 'upscale',
        title: 'Upscaling',
        description: 'Upscale images with high quality',
        thumbnail: upscaleThumbnail,
        credits:
            'https://comfyworkflows.com/workflows/810e1c6e-12ad-4487-8dc3-d54fadf8319f',
    },
    {
        id: 'img2img',
        title: 'Image to Image (img2img)',
        description: 'Stylize any input image (e.g. cartoon)',
        thumbnail: img2imgThumbnail,
        credits:
            'https://comfyworkflows.com/workflows/e20d73bf-116a-49e1-a869-b7f47b0056e8',
    },
    {
        id: 'vid2vid',
        title: 'Video to Video (vid2vid)',
        description: 'Stylize any input video (e.g. anime style)',
        thumbnail: vid2vidThumbnail,
        credits:
            'https://comfyworkflows.com/workflows/84e00774-4a21-4555-b4dd-063eec3e604a',
    },
    {
        id: 'img2vid',
        title: 'Image to Video (img2vid)',
        description:
            'Create videos from an input image using Stable Video Diffusion',
        thumbnail: img2vidThumbnail,
        credits:
            'https://comfyworkflows.com/workflows/14e821f5-8111-4178-8d6e-c43ab02d8376',
    },
]

function NewWorkflowUI() {
    const getSettingsQuery = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const response = await fetch(`/api/settings`)
            const data = await response.json()
            return data as Settings
        },
    })

    if (getSettingsQuery.isError) {
        return <div>Something went wrong, please refresh the page.</div>
    }

    if (getSettingsQuery.isLoading || !getSettingsQuery.data) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col p-10">
            <div>
                <h1 className="text-3xl font-semibold">New workflow</h1>
            </div>
            <div className="flex flex-col mt-10">
                <div>
                    <Masonry
                        itemKey={(item) => item.id}
                        columnGutter={20}
                        columnWidth={350}
                        items={workflowTemplates}
                        render={(props) => (
                            <WorkflowTemplate settings={getSettingsQuery.data} item={props.data} />
                        )}
                    />
                </div>
            </div>
        </div>
    )
}

export default NewWorkflowUI
