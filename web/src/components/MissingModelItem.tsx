'use client';

import { Loader2Icon, AlertTriangle, Replace, File, CheckCircle, InfoIcon, Import } from 'lucide-react';
import { useState } from 'react'
import { UseMutationResult } from '@tanstack/react-query';
import { Button } from './ui/button';
import { MissingModel, Source } from '@/lib/types';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
// import ImportURLUI from './ImportURLUI';
import HFLogo from './HFLogo';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

function MissingModelItem({ missingModel, resolveMutationToUse, unResolveMutationToUse }: { missingModel: MissingModel, resolveMutationToUse: UseMutationResult<void, Error, { filename: string; node_type: string; source: Source; }, unknown>, unResolveMutationToUse: UseMutationResult<void, Error, { filename: string; }, unknown>}) {
    const [loading, setLoading] = useState(false);
    const [resolved, setResolved] = useState(true);
    const [newFileName, setNewFileName] = useState("");
    const [modelURLToImport, setModelURLToImport] = useState("");
    const [modelTypeToImport, setModelTypeToImport] = useState<"hf" | "civit">("hf");
    const [importLoading, setImportLoading] = useState(false);

    const morphingPlaceholder = () => {
        if (modelTypeToImport === "hf") {
            return 'https://huggingface.co/h94/IP-Adapter-FaceID/blob/main/ip-adapter-faceid_sd15_lora.safetensors';
        } else if (modelTypeToImport === "civit") {
            return 'https://civitai.com/models/4201/realistic-vision-v60-b1?modelVersionId=130072'
        } else {
            return 'custom.com'
        }
    }

    if (!resolved) {
        return (
            <div className='w-full flex flex-col items-start gap-4'>
                <div className='w-full flex flex-row items-center justify-between'>
                    <div className='flex flex-row items-center gap-2'>
                        {loading ? <Loader2Icon className=' text-orange-500 animate-spin w-4 h-4' /> : <AlertTriangle className='w-4 h-4 text-red-500' />}
                        <h3 className='text-white font-bold'>{missingModel.filename}</h3>
                        <Badge className='flex flex-row items-center gap-2'>
                            <InfoIcon className='w-4 h-4' />
                            {missingModel.node_type}
                        </Badge>
                    </div>
                </div>
                <div className='w-full flex flex-col items-start gap-4'>
                    <div className='w-full flex flex-col items-start gap-'>
                        <div className='flex flex-row items-center gap-2'>
                            <Replace className='w-4 h-4 text-green-400' />
                            <p className='text-white font-semibold'>Replace with</p>
                        </div>
                        {missingModel.suggestions.map((suggestion) => {
                            return (
                                <div key={suggestion.hf_file_id || suggestion.civitai_file_id} className='w-full flex flex-row items-center justify-between my-1'>
                                    <div className='flex flex-row items-center space-x-2'>
                                        {suggestion.source === "civitai" ? <img alt={`civitai logo for model ${suggestion.filename}`} src='/civitai-logo-github.png' className='ph-no-capture w-5 h-5' /> : <HFLogo className='w-5 h-5' />}
                                        <p className='text-white'>{suggestion.filename}</p>
                                        {suggestion.filepath && 
                                        <Badge className='flex flex-row items-center gap-2'>
                                            <File className='w-4 h-4' />
                                            {suggestion.filepath}
                                        </Badge>}
                                    </div>
                                    <div className='flex flex-row items-center gap-2'>
                                        <Button
                                        size='sm'
                                        className=''
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            setLoading(true);
                                            try {
                                                const mutation = await resolveMutationToUse.mutateAsync({ filename: missingModel.filename, node_type: missingModel.node_type, source: { type: suggestion.civitai_file_id ? "civitai" : "hf",  file_id: suggestion.hf_file_id || suggestion.civitai_file_id, url: null } })
                                                // resolveMutationToUse.mutate({ filename: missingModel.filename, node_type: missingModel.node_type, source: { type: suggestion.civitai_file_id ? "civitai" : "hf",  file_id: suggestion.hf_file_id || suggestion.civitai_file_id, url: null } })
                                                console.log("mutation:", mutation);
                                                setNewFileName(suggestion.filename);
                                                setResolved(true);
                                            } catch (error: unknown) {
                                                toast.error("there was an error when selecting the suggestion, please try again!")
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        >
                                            Use this model
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className='w-full flex flex-col items-start gap-2'>
                        <div className='flex flex-row items-center gap-2'>
                            <Import className='w-4 h-4 text-green-400' />
                            <p className='text-white font-semibold'>Or import from URL</p>
                        </div>
                        <div className='flex flex-row items-center space-x-4'>
                            <RadioGroup 
                            className='flex flex-row' 
                            defaultValue="hf" 
                            onValueChange={(currentValue) => {
                                if (currentValue === "hf" || currentValue === "civit") {
                                    setModelTypeToImport(currentValue);
                                }
                            }}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem className='text-white border-white' value="hf" id="r1" />
                                    <Label className='text-white' htmlFor="r1">Hugging Face</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem className='text-white border-white' value="civit" id="r2" />
                                    <Label className='text-white' htmlFor="r2">Civit AI</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className='w-full flex flex-row space-x-2 items-center'>
                            <Input
                            className='border-[#222] bg-[#000] text-white'
                            placeholder={morphingPlaceholder()}
                            value={modelURLToImport}
                            onChange={(e) => {
                                e.preventDefault();
                                setModelURLToImport(e.target.value);
                            }}
                            />
                            <Button 
                            onClick={async (e) => {
                                e.preventDefault();
                                setLoading(true);
                                setImportLoading(true);
                                try {
                                    const mutation = await resolveMutationToUse.mutateAsync({ filename: missingModel.filename, node_type: missingModel.node_type, source: { type: modelURLToImport.startsWith('https://huggingface.co/') ? "hf" : "civitai",  file_id: null, url: modelURLToImport } })
                                    // resolveMutationToUse.mutate({ filename: missingModel.filename, node_type: missingModel.node_type, source: { type: modelURLToImport.startsWith('https://huggingface.co/') ? "hf" : "civitai",  file_id: null, url: modelURLToImport } })
                                    console.log("mutation:", mutation);
                                    setNewFileName(modelURLToImport);
                                    setResolved(true);
                                } catch (error) {
                                    toast.error("there was an error importing the url, please try again!")
                                } finally {
                                    setLoading(false);
                                    setImportLoading(false);
                                }
                            }}
                            >
                                {importLoading ? <Loader2Icon className='w-4 h-4 animate-spin text-white' /> : 'Import'}
                            </Button>
                        </div>
                    </div>
                </div>
                <Separator className='bg-[#444]' />
            </div>
        )
    } else {
        return (
            <div className='w-full flex flex-row items-center justify-between'>
                <div className='flex flex-row items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-400' />
                    <h3 className='text-white font-bold'>{newFileName}</h3>
                    <h3 className='text-[#999] font-bold line-through ml-2'>{missingModel.filename}</h3>
                </div>
                <Button 
                size='sm'
                onClick={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                        const mutation = await unResolveMutationToUse.mutateAsync({ filename: missingModel.filename })
                        // unResolveMutationToUse.mutate({ filename: missingModel.filename })
                        console.log("mutation:", mutation);
                        setResolved(false);
                        setNewFileName("");
                    } catch (error: unknown) {
                        toast.error("something went wrong when attempting to edit your model. please try again.")
                    } finally {
                        setLoading(false);
                    }
                }}
                >
                    Edit
                </Button>
            </div>
        )
    }
}

export default MissingModelItem;