import { useState, useEffect } from 'react';
import axios from 'axios';
import { calculateDCBRAGStatus } from 'src/helpers/calculateDCBRAGStatus';
import { calculateKeycloakRAGStatus } from 'src/helpers/calculateKeycloakRAGStatus';


export default function EnvironmentHealth(props: {apiLink : string, environment: string} ){
const [healthData, setHealthData] = useState<any | null>(null);
const [RAGStatus, setRAGStatus] = useState<'Down' | 'Partial' | 'Up' | 'Undefined'>();

// Fetch health data from the API endpoint when the component mounts or when healthData changes
useEffect(() => {
    const fetchHealthData = async () => {
        try {
            const responseDCBHealth = await axios.get(props.apiLink);
            setHealthData(responseDCBHealth.data);
        } catch (error: any) {
            if (error.response) {
                /*The error may trigger even though the data is valid, in these situations
                we set healthData to the response data
                */
                setHealthData(error?.response?.data);
            } else {
                console.error('Unexpected error occurred with health data:', error);
            }
        }
    };
    if (!healthData) {
        fetchHealthData();
      }
}, [healthData, props.apiLink]);

// if dependencies change, recalculate function
useEffect(() => {
    if (healthData) {
        if (props.environment == 'dcb') {
            const calculatedRAGStatus = calculateDCBRAGStatus(healthData);
            setRAGStatus(calculatedRAGStatus);
        }
        else if (props.environment == 'keycloak'){
            const calculatedRAGStatus = calculateKeycloakRAGStatus(healthData);
            setRAGStatus(calculatedRAGStatus);
        } else {
            setRAGStatus('Undefined')
        }
    }
}, [healthData, props.environment]) // Dependency on healthData triggers a recalculation when healthData changes

return(
    <>
    {/* Displays the calculated status */}
    {RAGStatus}
    </>
);
}