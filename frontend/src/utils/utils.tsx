import React from 'react';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import AccessibleIcon from '@mui/icons-material/Accessible';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import WbIncandescentIcon from '@mui/icons-material/WbIncandescent';
import DeleteIcon from '@mui/icons-material/Delete';
import TrafficIcon from '@mui/icons-material/Traffic';
import ParkIcon from '@mui/icons-material/Park';
import CategoryIcon from '@mui/icons-material/Category';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import type { ReactElement } from 'react';

export function getCategoryIcon(category: string): ReactElement {
    switch (category) {
        case 'Water Supply – Drinking Water': return <LocalDrinkIcon />;
        case 'Architectural Barriers': return <AccessibleIcon />;
        case 'Sewer System': return <PlumbingIcon />;
        case 'Public Lighting': return <WbIncandescentIcon />;
        case 'Waste': return <DeleteIcon />;
        case 'Road Signs and Traffic Lights': return <TrafficIcon />;
        case 'Roads and Urban Furnishings': return <CategoryIcon />;
        case 'Public Green Areas and Playgrounds': return <ParkIcon />;
        default: return <ReportProblemIcon />;
    }
}

export function getCategoryIconComponent(category: string) {
    // returns the component so callers can render with props if they need to
    switch (category) {
        case 'Water Supply – Drinking Water': return LocalDrinkIcon;
        case 'Architectural Barriers': return AccessibleIcon;
        case 'Sewer System': return PlumbingIcon;
        case 'Public Lighting': return WbIncandescentIcon;
        case 'Waste': return DeleteIcon;
        case 'Road Signs and Traffic Lights': return TrafficIcon;
        case 'Roads and Urban Furnishings': return CategoryIcon;
        case 'Public Green Areas and Playgrounds': return ParkIcon;
        default: return ReportProblemIcon;
    }
}
