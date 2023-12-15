import SimpleTable from '@components/SimpleTable/SimpleTable';
import { useTranslation } from 'next-i18next'; //localisation
import { Trans } from 'next-i18next';


export default function ConsortiumDetails() {
    const { t } = useTranslation();

    //values in t() to be replaced by dynamic values
    const ConsortiumDetails = [
        [t('onboarding.stage.introduce_libraries.name'), t('onboarding.stage.introduce_libraries.action'), 
        <>{t('onboarding.stage.introduce_libraries.status_known', {count: 81, consortium_name: 'MOBIUS'})}
        <br/><br/>{t('onboarding.stage.introduce_libraries.status_missing', {count: 73})}</>],

        [t('onboarding.stage.provision_systems.name'), t('onboarding.stage.provision_systems.action'),
        <>{t('onboarding.stage.provision_systems.status_known', {count: 51, consortium_name: 'MOBIUS'})}
        <br/><br/>{t('onboarding.stage.provision_systems.status_missing', {count: 41})}</>],

        [t('onboarding.stage.configure_services.name'), t('onboarding.stage.configure_services.action'),
        <>{t('onboarding.stage.configure_services.status_config', {count: 73})}
        <br/><br/>{t('onboarding.stage.configure_services.status_testing', {count: 64})}</>],

        [t('onboarding.stage.migrate_service.name'), t('onboarding.stage.migrate_service.action'),
        <>{t('onboarding.stage.migrate_service.status_migration', {count: 81})}
        <br/><br/>{t('onboarding.stage.migrate_service.status_signoff',{count: 81})}</>],

        [t('onboarding.stage.operate_dcb.name'), t('onboarding.stage.operate_dcb.action'), 
        t('onboarding.stage.operate_dcb.status_operators', {count: 0}),],
        
        [t('onboarding.stage.manage_support.name'), t('onboarding.stage.manage_support.action'),
        t('onboarding.stage.manage_support.status_support', {count: 0})]
    ];

    return(
        <SimpleTable column_names={[t('onboarding.summary.stage'), t('onboarding.summary.action'), t('onboarding.summary.status')]} row_data={ConsortiumDetails}/>
    )
};