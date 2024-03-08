'use client'

import { Loader2Icon, Import } from 'lucide-react'
import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from './ui/input'
import { UseMutationResult } from '@tanstack/react-query'
import { Button } from './ui/button'

function ImportURLUI({
    failed_model_id,
    mutationToUse,
}: {
    failed_model_id: string
    mutationToUse: UseMutationResult<
        undefined,
        Error,
        { id_to_resolve: string; url: string; type: string },
        unknown
    >
}) {
    const [modelURLToImport, setModelURLToImport] = useState('')
    const [modelTypeToImport, setModelTypeToImport] = useState<
        'hf' | 'civit' | 'custom'
    >('hf')
    const [importLoading, setImportLoading] = useState(false)

    const morphingPlaceholder = () => {
        if (modelTypeToImport === 'hf') {
            return 'https://huggingface.co/h94/IP-Adapter-FaceID/blob/main/ip-adapter-faceid_sd15_lora.safetensors'
        } else if (modelTypeToImport === 'civit') {
            return 'https://civitai.com/models/4201/realistic-vision-v60-b1?modelVersionId=130072'
        } else {
            return 'custom.com'
        }
    }

    return (
        <div className="w-full flex flex-col items-start gap-2">
            <div className="flex flex-row items-center gap-2">
                <Import className="w-4 h-4 text-green-400" />
                <p className="text-white font-semibold">Or import from URL</p>
            </div>
            <div className="flex flex-row items-center space-x-4">
                <RadioGroup
                    className="flex flex-row"
                    defaultValue="hf"
                    onValueChange={(currentValue) => {
                        if (
                            currentValue === 'hf' ||
                            currentValue === 'civit' ||
                            currentValue === 'custom'
                        ) {
                            setModelTypeToImport(currentValue)
                        }
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem
                            className="text-white border-white"
                            value="hf"
                            id="r1"
                        />
                        <Label className="text-white" htmlFor="r1">
                            Hugging Face
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem
                            className="text-white border-white"
                            value="civit"
                            id="r2"
                        />
                        <Label className="text-white" htmlFor="r2">
                            Civit AI
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem
                            className="text-white border-white"
                            value="custom"
                            id="r3"
                        />
                        <Label className="text-white" htmlFor="r3">
                            Custom
                        </Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="w-full flex flex-row space-x-2 items-center">
                <Input
                    className="border-[#222] bg-[#000] text-white"
                    placeholder={morphingPlaceholder()}
                    value={modelURLToImport}
                    onChange={(e) => {
                        e.preventDefault()
                        setModelURLToImport(e.target.value)
                    }}
                />
                <Button
                    onClick={(e) => {
                        e.preventDefault()
                        setImportLoading(true)
                        mutationToUse.mutate({
                            id_to_resolve: failed_model_id,
                            url: modelURLToImport,
                            type: modelTypeToImport,
                        })
                    }}
                >
                    {importLoading ? (
                        <Loader2Icon className="w-4 h-4 animate-spin text-white" />
                    ) : (
                        'Import'
                    )}
                </Button>
            </div>
        </div>
    )
}

export default ImportURLUI
