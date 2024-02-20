'use client';

import { Project } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import { Masonry } from 'masonic'
import React from 'react'
import ProjectCard from './ProjectCard'

function WorkflowsGridView() {

    const getProjectsQuery = useQuery({ queryKey: ['projects'], queryFn: async () => {
        const response = await fetch(`/api/projects`)
        const data = await response.json() as Project[]
        return data
    }})

    if (getProjectsQuery.isLoading) {
        return <div>Loading...</div>
    }

    if (getProjectsQuery.isError) {
        return <div>Something went wrong, please refresh the page.</div>
    }

    if (!getProjectsQuery.data || getProjectsQuery.data.length === 0) {
        return <></>
    }
    
    return (
        <div>
            <Masonry key={getProjectsQuery.data.map(p => p.id).join(",")} itemKey={(item, index) => item === undefined ? index : item.id} columnGutter={20} columnWidth={350} items={getProjectsQuery.data} render={(props) => <ProjectCard item={props.data} />} />
        </div>
    )
}

export default WorkflowsGridView