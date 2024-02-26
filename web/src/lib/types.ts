export type WorkflowTemplateId = "empty" | "animate_diff" | "svd" | "upscale" | "img2img" | "vid2vid" | "img2vid";

export type WorkflowTemplateItem = {
    id: WorkflowTemplateId;
    title: string;
    description: string;
    thumbnail: string;
    isThumbnailVideo?: boolean;
    credits?: string;
}

export type Config = {
    credentials: {
        civitai: {
            apikey: string
        }
    }
}

export type ProjectState = {
    state: "install_comfyui" | "install_custom_nodes" | "download_files" | "ready" | "download_comfyui" | "running"
    status_message: string,
    port? : number | null,
    pid? : number | null,
    id: string,
    name: string,
}

export type Project = {
    id: string,
    state: ProjectState,
    project_folder_name: string,
    project_folder_path: string,
    last_modified: number
}