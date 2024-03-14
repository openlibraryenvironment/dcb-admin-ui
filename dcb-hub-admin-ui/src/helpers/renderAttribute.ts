export const renderAttribute = (attribute: any) => {
    // If needs be, we can extend this function to apply other 'rules' to our values as well
    // in theory this could return a Typography component with more styling
    return (attribute!=null && attribute!="" && attribute!=undefined ? attribute : "-");
}