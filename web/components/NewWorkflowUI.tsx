'use client';

import React from 'react'
import WorkflowTemplate from './WorkflowTemplate';
import { Masonry } from 'masonic';
import { WorkflowTemplateItem } from '@/lib/types';


const workflowTemplates: WorkflowTemplateItem[] = [
    {
        id: "empty",
        title: "Empty",
        description: "Blank new ComfyUI project",
        thumbnail: "",
    },
    {
        id: "animate_diff",
        title: "AnimateDiff",
        description: "Create animations from a prompt",
        thumbnail: "/workflow_templates/animate_diff/thumbnail.webp",
        credits: "https://comfyworkflows.com/workflows/cc4b1b3f-735a-4e22-b241-148606544301"
    },
    {
        id: "svd",
        title: "Stable Video Diffusion",
        description: "Create videos from a prompt",
        thumbnail: "/workflow_templates/svd/thumbnail.webp",
        credits: "https://comfyworkflows.com/workflows/ae9275b2-c303-48fb-a539-13451dd93808"
    },
    {
        id: "upscale",
        title: "Upscaling",
        description: "Upscale images with high quality",
        thumbnail: "/workflow_templates/upscale/thumbnail.webp",
        credits: "https://comfyworkflows.com/workflows/810e1c6e-12ad-4487-8dc3-d54fadf8319f"
    },
    {
        id: "img2img",
        title: "Image to Image (img2img)",
        description: "Stylize any input image (e.g. cartoon)",
        thumbnail: "/workflow_templates/img2img/thumbnail.webp",
        credits: "https://comfyworkflows.com/workflows/e20d73bf-116a-49e1-a869-b7f47b0056e8"
    },
    {
        id: "vid2vid",
        title: "Video to Video (vid2vid)",
        description: "Stylize any input video (e.g. anime style)",
        thumbnail: "/workflow_templates/vid2vid/thumbnail.mp4",
        isThumbnailVideo: true,
        credits: "https://comfyworkflows.com/workflows/84e00774-4a21-4555-b4dd-063eec3e604a"
    },
    {
        id: "img2vid",
        title: "Image to Video (img2vid)",
        description: "Create videos from an input image using Stable Video Diffusion",
        thumbnail: "/workflow_templates/img2vid_svd/thumbnail.webp",
        credits: "https://comfyworkflows.com/workflows/14e821f5-8111-4178-8d6e-c43ab02d8376"
    },
];

function NewWorkflowUI() {
    const [isServerSide, setIsServerSide] = React.useState(true)

    React.useEffect(() => {
        setIsServerSide(false)
    }, [])

    if (isServerSide) {
        return
    }

    return (
        <div className="flex flex-col p-10">
            <div><h1 className="text-3xl font-semibold">New workflow</h1></div>
            <div className="flex flex-col mt-10">
                {/* <div><h1 className="text-lg font-semibold">Choose a template</h1></div> */}
                <div>
                    <Masonry itemKey={(item) => item.id} columnGutter={20} columnWidth={350} items={workflowTemplates} render={(props) => <WorkflowTemplate item={props.data} />} />
                </div>
            </div>
        </div>
    )
}

export default NewWorkflowUI