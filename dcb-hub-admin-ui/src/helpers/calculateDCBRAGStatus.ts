export function calculateDCBRAGStatus(data: any): 'Down' | 'Partial' | 'Up' | 'Undefined' {
    if (!data || !data.details) {
        return 'Undefined';
    }
    
    //Object.values returns an array
    //extract all status values from data.details
    const allStatus = Object.values(data.details).map((detail: any) => detail.status);

    if (allStatus.every((status) => status === 'DOWN')) { 
        return 'Down'; // All statuses are 'DOWN'
    } else if (allStatus.some((status) => status === 'DOWN')) {
        return 'Partial' // At least one status is 'DOWN'
    } else if (allStatus.every((status) => status === 'UP')) {
        return 'Up' // All statuses are 'UP'
    } else {
        return 'Undefined'; // RAG status cannot be determined
    };
};