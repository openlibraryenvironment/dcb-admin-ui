import SimpleTable from '@components/SimpleTable/SimpleTable';
import { useTranslation } from 'next-i18next'; //localisation
import { Trans } from 'next-i18next';


export default function ConsortiumDetails() {
    const { t } = useTranslation();

    //values in t() to be replaced by dynamic values
    const ConsortiumDetails = [
        [t('onboarding.stage.introduce_libraries.name'), t('onboarding.stage.introduce_libraries.action'), 
        <>{t('onboarding.stage.introduce_libraries.status_known_other', {agencies_total: '81', consortium_name: 'MOBIUS'})}
        <br/><br/>{t('onboarding.stage.introduce_libraries.status_missing_other', {agencies_incomplete: '73'})}</>],

        [t('onboarding.stage.provision_systems.name'), t('onboarding.stage.provision_systems.action'),
        <>{t('onboarding.stage.provision_systems.status_known_other', {hostlmss_total: '51', consortium_name: 'MOBIUS'})}
        <br/><br/>{t('onboarding.stage.provision_systems.status_missing_other', {hostlmss_incomplete: '41'})}</>],

        [t('onboarding.stage.configure_services.name'), t('onboarding.stage.configure_services.action'),
        <>{t('onboarding.stage.configure_services.status_config_other', {config_incomplete: '73', testing_incomplete: '64'})}
        <br/><br/>{t('onboarding.stage.configure_services.status_testing_other', {testing_incomplete: '64'})}</>],

        [t('onboarding.stage.migrate_service.name'), t('onboarding.stage.migrate_service.action'),
        <>{t('onboarding.stage.migrate_service.status_migration_other', {migration_incomplete: '81', signoff_incomplete: '81'})}
        <br/><br/>{t('onboarding.stage.migrate_service.status_signoff_other',{signoff_incomplete: '81'})}</>],

        [t('onboarding.stage.operate_dcb.name'), t('onboarding.stage.operate_dcb.action'), 
        t('onboarding.stage.operate_dcb.status_operators_other', {consortium_administrators: '0'}),],
        
        [t('onboarding.stage.manage_support.name'), t('onboarding.stage.manage_support.action'),
        t('onboarding.stage.manage_support.status_support_other', {consortium_support: '0'})]
    ];

    return(
        <SimpleTable column_names={[t('onboarding.summary.stage'), t('onboarding.summary.action'), t('onboarding.summary.status')]} row_data={ConsortiumDetails}/>
    )
};