import SimpleTable from '@components/SimpleTable/SimpleTable';
import { useTranslation } from 'next-i18next'; //localisation
import { Trans } from 'next-i18next';


export default function ConsortiumDetails() {
    const { t } = useTranslation();

    //values in trans component to be replaced by dynamic values
    const ConsortiumDetails = [
    [t('onboarding.stage.introduce_libraries.name'), t('onboarding.stage.introduce_libraries.action'), 
    <Trans 
    key={"introduceLibraries"} 
    i18nKey={'dashboard_consortium_details.row1_col3'} 
    components={{abbreviation: <abbr title='placeholder content' />}}
    values={{
        agencies_total: '81',
        consortium_name: 'MOBIUS'
    }}/>],
    [t('onboarding.stage.provision_systems.name'), t('onboarding.stage.provision_systems.action'), 
    <Trans
    key={'provisionSystems'}
    i18nKey={'dashboard_consortium_details.row2_col3'} 
    components={{abbreviation: <abbr title='placeholder content' />}}
    values={{
        hostlmss_total: '51',
        consortium_name: 'MOBIUS'
    }}/>],
    [t('onboarding.stage.configure_services.name'), t('onboarding.stage.configure_services.action'), 
    <Trans key={'configureServices'} i18nKey={'dashboard_consortium_details.row3_col3'} components={{abbreviation: <abbr title='placeholder content' />}}/>],
    [t('onboarding.stage.migrate_service.name'), t('onboarding.stage.migrate_service.action'),
    <Trans key={'migrateServices'} i18nKey={'dashboard_consortium_details.row4_col3'} components={{abbreviation: <abbr title='placeholder content' />}}/>],
    [t('onboarding.stage.operate_dcb.name'), t('onboarding.stage.operate_dcb.action'), 
    <Trans key={'operateDCB'} i18nKey={'dashboard_consortium_details.row5_col3'} components={{abbreviation: <abbr title='placeholder content' />}}/>],
    [t('onboarding.stage.manage_support.name'), t('onboarding.stage.manage_support.action'),
    <Trans key={'manageSupport'} i18nKey={'dashboard_consortium_details.row6_col3'} components={{abbreviation: <abbr title='placeholder content' />}}/>]];

    return(
        <SimpleTable column_names={[t('onboarding.summary.stage'), t('onboarding.summary.action'), t('onboarding.summary.status')]} row_data={ConsortiumDetails}/>
    )
};