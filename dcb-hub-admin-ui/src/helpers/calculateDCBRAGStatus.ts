export function calculateDCBRAGStatus(data: any): 'Down' | 'Partial' | 'Up' | 'Undefined' {
    if (!data || !data.details) {
        return 'Undefined';
    }

    const keys = [
        'elasticsearchclient',
        'compositeDiscoveryClient()',
        'service',
        'diskSpace',
        'r2dbc-connection-factory',
        'jdbc',
        'ingest'
    ];
    
    // Get status values corresponding to keys from healthData
    const allStatus = keys.map(key => data?.details?.[key]?.status);

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