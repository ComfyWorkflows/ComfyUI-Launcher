'use client'

import {
    Loader2Icon,
    AlertTriangle,
    Replace,
    CheckCircle,
    InfoIcon,
    ChevronsUpDown,
    Fingerprint,
} from 'lucide-react'
import { useState } from 'react'
import { UseMutationResult } from '@tanstack/react-query'
import { Button } from './ui/button'
import { MissingModel, Source } from '@/lib/types'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import HFLogo from './HFLogo'
import { toast } from 'sonner'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'

function MissingModelItem({
    missingModel,
    resolveMutationToUse,
    unResolveMutationToUse,
}: {
    missingModel: MissingModel
    resolveMutationToUse: UseMutationResult<
        void,
        Error,
        {
            filename: string
            node_type: string
            dest_relative_path: string
            source: Source
        },
        unknown
    >
    unResolveMutationToUse: UseMutationResult<
        void,
        Error,
        { filename: string },
        unknown
    >
}) {
    const [loading, setLoading] = useState(false)
    const [resolved, setResolved] = useState(false)
    const [newFileName, setNewFileName] = useState('')
    const [isOpen, setIsOpen] = useState(true)

    if (!resolved) {
        return (
            <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="w-full flex flex-col items-start space-y-4"
            >
                <div className="w-full flex items-center justify-between space-x-4">
                    <div className="w-full flex flex-row items-center justify-between">
                        <div className="flex flex-row items-center gap-2">
                            {loading ? (
                                <Loader2Icon className=" text-orange-500 animate-spin w-5 h-5" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            )}
                            <h3 className="text-white text-lg font-bold">
                                {missingModel.filename}
                            </h3>
                            <Badge className="flex flex-row items-center gap-2">
                                <InfoIcon className="w-4 h-4" />
                                {missingModel.node_type}
                            </Badge>
                        </div>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button className="flex flex-row items-center gap-2">
                            <ChevronsUpDown className="h-4 w-4" />
                            {isOpen ? 'hide suggestions' : 'show suggestions'}
                            <span className="sr-only">Toggle</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>
                {/* below stuff that u wanna render outside of suggestions */}
                <CollapsibleContent className="space-y-2 w-full">
                    <div className="w-full flex flex-col items-start gap-4">
                        <div className="w-full flex flex-col items-start gap-4">
                            <div className="w-full flex flex-col items-start gap-">
                                <div className="flex flex-row items-center gap-2">
                                    <Replace className="w-4 h-4 text-green-400" />
                                    <h4 className="text-white text-md font-semibold">
                                        Replace with
                                    </h4>
                                </div>
                                {missingModel.suggestions.map((suggestion) => {
                                    return (
                                        <div
                                            key={`${suggestion.civitai_file_id}_${suggestion.hf_file_id}`}
                                            className="w-full flex flex-row items-center  my-1"
                                        >
                                            <Button
                                                size="sm"
                                                className="border border-[#222] shadow-sm shadow-[#fff] mr-3"
                                                // variant='secondary'
                                                onClick={async (e) => {
                                                    e.preventDefault()
                                                    setLoading(true)
                                                    try {
                                                        const mutation =
                                                            await resolveMutationToUse.mutateAsync(
                                                                {
                                                                    filename:
                                                                        missingModel.filename,
                                                                    node_type:
                                                                        missingModel.node_type,
                                                                    dest_relative_path:
                                                                        missingModel.dest_relative_path,
                                                                    source: {
                                                                        type: suggestion.civitai_file_id
                                                                            ? 'civitai'
                                                                            : 'hf',
                                                                        file_id:
                                                                            suggestion.hf_file_id ||
                                                                            suggestion.civitai_file_id,
                                                                        url: null,
                                                                    },
                                                                }
                                                            )
                                                        // resolveMutationToUse.mutate({ filename: missingModel.filename, node_type: missingModel.node_type, source: { type: suggestion.civitai_file_id ? "civitai" : "hf",  file_id: suggestion.hf_file_id || suggestion.civitai_file_id, url: null } })
                                                        console.log(
                                                            'mutation:',
                                                            mutation
                                                        )
                                                        setNewFileName(
                                                            suggestion.filename
                                                        )
                                                        setResolved(true)
                                                    } catch (error: unknown) {
                                                        toast.error(
                                                            'there was an error when selecting the suggestion, please try again!'
                                                        )
                                                    } finally {
                                                        setLoading(false)
                                                    }
                                                }}
                                            >
                                                Select
                                            </Button>
                                            <div className="flex flex-row   items-center space-x-3">
                                                {suggestion.source ===
                                                'civitai' ? (
                                                    <img
                                                        alt={`civitai logo for model ${suggestion.filename}`}
                                                        src="/civitai-logo-github.png"
                                                        className="ph-no-capture w-5 h-5"
                                                    />
                                                ) : (
                                                    <HFLogo className="w-5 h-5" />
                                                )}
                                                <a
                                                    href={suggestion.url}
                                                    target="_blank"
                                                >
                                                    <p className="text-white text-sm font-medium underline decoration-dotted">
                                                        {suggestion.filename}
                                                    </p>
                                                </a>
                                                <Badge className="flex flex-row items-center gap-2">
                                                    <InfoIcon className="w-4 h-4" />
                                                    {suggestion.node_type}
                                                </Badge>
                                                {suggestion.sha256_checksum && (
                                                    <Badge className="flex flex-row items-center gap-2">
                                                        <Fingerprint className="w-4 h-4" />
                                                        {`sha256: ${suggestion.sha256_checksum?.slice(
                                                            0,
                                                            6
                                                        )}...`}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-row items-center gap-2"></div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <Separator className="bg-[#444]" />
                    </div>
                </CollapsibleContent>
            </Collapsible>
        )
    } else {
        return (
            <div className="w-full flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <h3 className="text-white font-bold">{newFileName}</h3>
                    <h3 className="text-[#999] font-bold line-through ml-2">
                        {missingModel.filename}
                    </h3>
                </div>
                <Button
                    size="sm"
                    onClick={async (e) => {
                        e.preventDefault()
                        setLoading(true)
                        try {
                            const mutation =
                                await unResolveMutationToUse.mutateAsync({
                                    filename: missingModel.filename,
                                })
                            // unResolveMutationToUse.mutate({ filename: missingModel.filename })
                            console.log('mutation:', mutation)
                            setResolved(false)
                            setNewFileName('')
                        } catch (error: unknown) {
                            toast.error(
                                'something went wrong when attempting to edit your model. please try again.'
                            )
                        } finally {
                            setLoading(false)
                        }
                    }}
                >
                    Edit
                </Button>
            </div>
        )
    }
}

export default MissingModelItem
