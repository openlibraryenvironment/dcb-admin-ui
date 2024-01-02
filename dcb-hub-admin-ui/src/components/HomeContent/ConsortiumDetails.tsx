import SimpleTable from '@components/SimpleTable/SimpleTable';
import { useTranslation } from 'next-i18next'; //localisation
import Link from '@components/Link/Link';
import { ONBOARDING_LINKS } from 'homeData/homeConfig';


export default function ConsortiumDetails() {
    const { t } = useTranslation();

    //values in t() to be replaced by dynamic values
    const ConsortiumDetails = [
        [<Link href={ONBOARDING_LINKS.INTRODUCE_LIBRARIES} key="linkToHelpOnboardingIntroduce" target='_blank' rel="noreferrer">{t('onboarding.stage.introduce_libraries.name')}</Link>, t('onboarding.stage.introduce_libraries.action'), 
        <>{t('onboarding.stage.introduce_libraries.status_known', {count: 81, consortium_name: 'MOBIUS'})}
        <br/><br/>{t('onboarding.stage.introduce_libraries.status_missing', {count: 73})}</>],

        [<Link href={ONBOARDING_LINKS.PROVISION_SYSTEMS} key="linkToHelpOnboardingProvision" target='_blank' rel="noreferrer">{t('onboarding.stage.provision_systems.name')}</Link>, t('onboarding.stage.provision_systems.action'),
        <>{t('onboarding.stage.provision_systems.status_known', {count: 51, consortium_name: 'MOBIUS'})}
        <br/><br/>{t('onboarding.stage.provision_systems.status_missing', {count: 41})}</>],

        [<Link href={ONBOARDING_LINKS.CONFIGURE_SERVICES} key="linkToHelpOnboardingConfigure" target='_blank' rel="noreferrer">{t('onboarding.stage.configure_services.name')}</Link>, t('onboarding.stage.configure_services.action'),
        <>{t('onboarding.stage.configure_services.status_config', {count: 73})}
        <br/><br/>{t('onboarding.stage.configure_services.status_testing', {count: 64})}</>],

        [<Link href={ONBOARDING_LINKS.MIGRATE_SERVICE} key="linkToHelpOnboardingMigrate" target='_blank' rel="noreferrer">{t('onboarding.stage.migrate_service.name')}</Link>, t('onboarding.stage.migrate_service.action'),
        <>{t('onboarding.stage.migrate_service.status_migration', {count: 81})}
        <br/><br/>{t('onboarding.stage.migrate_service.status_signoff',{count: 81})}</>],

        [<Link href={ONBOARDING_LINKS.OPERATE_DCB} key="linkToHelpOnboardingOperate" target='_blank' rel="noreferrer">{t('onboarding.stage.operate_dcb.name')}</Link>, t('onboarding.stage.operate_dcb.action'), 
        t('onboarding.stage.operate_dcb.status_operators', {count: 0}),],
        
        [<Link href={ONBOARDING_LINKS.MANAGE_SUPPORT} key="linkToHelpOnboardingSupport" target='_blank' rel="noreferrer">{t('onboarding.stage.manage_support.name')}</Link>, t('onboarding.stage.manage_support.action'),
        t('onboarding.stage.manage_support.status_support', {count: 0})]
    ];

    return(
        <SimpleTable column_names={[t('onboarding.summary.stage'), t('onboarding.summary.action'), t('onboarding.summary.status')]} row_data={ConsortiumDetails}/>
    )
};