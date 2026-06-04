/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
};

export type AddAgencyToGroupCommand = {
  agency: Scalars['ID']['input'];
  group: Scalars['ID']['input'];
};

export type AddLibraryToGroupCommand = {
  library: Scalars['ID']['input'];
  libraryGroup: Scalars['ID']['input'];
};

/**
 * An Agency is a legal entity participating in resource sharing - perhaps an institution, or a consortium or some  other service provider, for
 * example Hathi Trust or internet archive. Agencies are the root object off which branch locations and other domain specific records can hang.
 */
export type Agency = {
  __typename?: 'Agency';
  authProfile?: Maybe<Scalars['String']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  hostLms?: Maybe<HostLms>;
  id?: Maybe<Scalars['ID']['output']>;
  isBorrowingAgency?: Maybe<Scalars['Boolean']['output']>;
  isSupplyingAgency?: Maybe<Scalars['Boolean']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  locations?: Maybe<Array<Maybe<Location>>>;
  longitude?: Maybe<Scalars['Float']['output']>;
  maxConsortialLoans?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/**
 * An agency group is a collection of Agencies that can be referred to as a group. Agencies are "Members" of agency groups and properties can be
 * attached to the membership. Agency groups most often represent consortia. The consortium itself is probably still best modelled as an Agency
 * for the purposes of it's interactions with other systems, but for modelling the members of a consortium, agency group is a useful abstracton for
 * expressing the aggregation of agencies under a single heading
 */
export type AgencyGroup = {
  __typename?: 'AgencyGroup';
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  members?: Maybe<Array<Maybe<AgencyGroupMember>>>;
  name: Scalars['String']['output'];
};

/**
 * Graphql does not allow types to be reused as input types as the semantics are different. We create the input types here.
 * AgencyGroupInput : fields that define a new agency group.
 */
export type AgencyGroupInput = {
  code: Scalars['String']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
};

export type AgencyGroupMember = {
  __typename?: 'AgencyGroupMember';
  agency?: Maybe<Agency>;
  group?: Maybe<AgencyGroup>;
  id: Scalars['ID']['output'];
};

export type AgencyGroupPage = {
  __typename?: 'AgencyGroupPage';
  content?: Maybe<Array<Maybe<AgencyGroup>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type AgencyPage = {
  __typename?: 'AgencyPage';
  content?: Maybe<Array<Maybe<Agency>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type Alarm = {
  __typename?: 'Alarm';
  alarmDetails?: Maybe<Scalars['JSON']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  created?: Maybe<Scalars['String']['output']>;
  expires?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastSeen?: Maybe<Scalars['String']['output']>;
  repeatCount?: Maybe<Scalars['Float']['output']>;
};

export type AlarmPage = {
  __typename?: 'AlarmPage';
  content?: Maybe<Array<Maybe<Alarm>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type BibRecord = {
  __typename?: 'BibRecord';
  author?: Maybe<Scalars['String']['output']>;
  canonicalMetadata?: Maybe<Scalars['JSON']['output']>;
  clusterReason?: Maybe<Scalars['String']['output']>;
  contributesTo?: Maybe<ClusterRecord>;
  dateCreated?: Maybe<Scalars['String']['output']>;
  dateOfPublication?: Maybe<Scalars['String']['output']>;
  dateUpdated?: Maybe<Scalars['String']['output']>;
  edition?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isLargePrint?: Maybe<Scalars['Boolean']['output']>;
  matchPoints?: Maybe<Array<Maybe<MatchPoint>>>;
  metadataScore?: Maybe<Scalars['Int']['output']>;
  placeOfPublication?: Maybe<Scalars['String']['output']>;
  processVersion?: Maybe<Scalars['Int']['output']>;
  publisher?: Maybe<Scalars['String']['output']>;
  sourceRecord?: Maybe<SourceRecord>;
  sourceRecordId?: Maybe<Scalars['String']['output']>;
  sourceRecordUuid?: Maybe<Scalars['String']['output']>;
  sourceSystemId?: Maybe<Scalars['ID']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  typeOfRecord?: Maybe<Scalars['String']['output']>;
};

export type BibRecordPage = {
  __typename?: 'BibRecordPage';
  content?: Maybe<Array<Maybe<BibRecord>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type ClusterRecord = {
  __typename?: 'ClusterRecord';
  dateCreated?: Maybe<Scalars['String']['output']>;
  dateUpdated?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isDeleted?: Maybe<Scalars['Boolean']['output']>;
  lastIndexed?: Maybe<Scalars['String']['output']>;
  members?: Maybe<Array<Maybe<BibRecord>>>;
  selectedBib?: Maybe<Scalars['ID']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type ClusterRecordPage = {
  __typename?: 'ClusterRecordPage';
  content?: Maybe<Array<Maybe<ClusterRecord>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type Consortium = {
  __typename?: 'Consortium';
  aboutImageUploader?: Maybe<Scalars['String']['output']>;
  aboutImageUploaderEmail?: Maybe<Scalars['String']['output']>;
  aboutImageUrl?: Maybe<Scalars['String']['output']>;
  catalogueSearchUrl?: Maybe<Scalars['String']['output']>;
  changeCategory?: Maybe<Scalars['String']['output']>;
  changeReferenceUrl?: Maybe<Scalars['String']['output']>;
  contacts?: Maybe<Array<Maybe<Person>>>;
  dateOfLaunch?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  functionalSettings?: Maybe<Array<Maybe<FunctionalSetting>>>;
  headerImageUploader?: Maybe<Scalars['String']['output']>;
  headerImageUploaderEmail?: Maybe<Scalars['String']['output']>;
  headerImageUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  libraryGroup: LibraryGroup;
  name: Scalars['String']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  websiteUrl?: Maybe<Scalars['String']['output']>;
};

export type ConsortiumContact = {
  __typename?: 'ConsortiumContact';
  consortium?: Maybe<Consortium>;
  id?: Maybe<Scalars['ID']['output']>;
  person?: Maybe<Person>;
};

export type ConsortiumContactInput = {
  changeCategory: Scalars['String']['input'];
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  consortiumId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  isPrimaryContact: Scalars['Boolean']['input'];
  lastName: Scalars['String']['input'];
  reason: Scalars['String']['input'];
  role: Scalars['String']['input'];
};

export type ConsortiumInput = {
  aboutImageUrl?: InputMaybe<Scalars['String']['input']>;
  catalogueSearchUrl?: InputMaybe<Scalars['String']['input']>;
  changeCategory: Scalars['String']['input'];
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  contacts?: InputMaybe<Array<InputMaybe<PersonInput>>>;
  dateOfLaunch: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  displayName: Scalars['String']['input'];
  functionalSettings?: InputMaybe<Array<InputMaybe<FunctionalSettingInput>>>;
  groupName: Scalars['String']['input'];
  headerImageUrl?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  reason: Scalars['String']['input'];
  websiteUrl?: InputMaybe<Scalars['String']['input']>;
};

export type ConsortiumPage = {
  __typename?: 'ConsortiumPage';
  content?: Maybe<Array<Maybe<Consortium>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type CreateHostLmsInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  clientConfig?: InputMaybe<Scalars['JSON']['input']>;
  code: Scalars['String']['input'];
  ingestSourceClass?: InputMaybe<Scalars['String']['input']>;
  itemSuppressionRulesetName?: InputMaybe<Scalars['String']['input']>;
  lmsClientClass: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  suppressionRulesetName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateHostLmsResult = {
  __typename?: 'CreateHostLmsResult';
  hostLms?: Maybe<HostLms>;
  ingestStatus?: Maybe<Scalars['String']['output']>;
  pingStatus?: Maybe<Scalars['String']['output']>;
  warnings?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type CreateLibraryContactInput = {
  changeCategory: Scalars['String']['input'];
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  isPrimaryContact: Scalars['Boolean']['input'];
  lastName: Scalars['String']['input'];
  libraryId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
  role: Scalars['String']['input'];
};

export type CreateLocationInput = {
  agencyCode: Scalars['String']['input'];
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  deliveryStops: Scalars['String']['input'];
  hostLmsCode: Scalars['String']['input'];
  isEnabledForPickupAnywhere?: InputMaybe<Scalars['Boolean']['input']>;
  isPickup: Scalars['Boolean']['input'];
  latitude: Scalars['Float']['input'];
  localId?: InputMaybe<Scalars['String']['input']>;
  longitude: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  printLabel: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type CreateReferenceValueMappingInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  fromCategory: Scalars['String']['input'];
  fromContext: Scalars['String']['input'];
  fromValue: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  toCategory: Scalars['String']['input'];
  toContext: Scalars['String']['input'];
  toValue: Scalars['String']['input'];
};

export type CreateRoleInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  displayName: Scalars['String']['input'];
  keycloakRole: Scalars['String']['input'];
  name: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type DailyPatronRequestStat = {
  __typename?: 'DailyPatronRequestStat';
  bibClusterId?: Maybe<Scalars['ID']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  dateCreated?: Maybe<Scalars['String']['output']>;
  patronHostlmsCode?: Maybe<Scalars['String']['output']>;
  pickupLocationCode?: Maybe<Scalars['String']['output']>;
  statusCode?: Maybe<Scalars['String']['output']>;
};

export type DataChangeLog = {
  __typename?: 'DataChangeLog';
  actionInfo: Scalars['String']['output'];
  changeCategory?: Maybe<Scalars['String']['output']>;
  changeReferenceUrl?: Maybe<Scalars['String']['output']>;
  changes: Scalars['JSON']['output'];
  entityId: Scalars['String']['output'];
  entityType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastEditedBy?: Maybe<Scalars['String']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  timestampLogged: Scalars['String']['output'];
};

export type DataChangeLogPage = {
  __typename?: 'DataChangeLogPage';
  content?: Maybe<Array<Maybe<DataChangeLog>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type DeleteConsortiumContactInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  consortiumId: Scalars['ID']['input'];
  personId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteEntityInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteEntityPayload = {
  __typename?: 'DeleteEntityPayload';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type DeleteLibraryContactInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  libraryId: Scalars['ID']['input'];
  personId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type FunctionalSetting = {
  __typename?: 'FunctionalSetting';
  description?: Maybe<Scalars['String']['output']>;
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  name: FunctionalSettingType;
};

export type FunctionalSettingInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  consortiumName?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  enabled: Scalars['Boolean']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  name: FunctionalSettingType;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type FunctionalSettingPage = {
  __typename?: 'FunctionalSettingPage';
  content?: Maybe<Array<Maybe<FunctionalSetting>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export enum FunctionalSettingType {
  DenyLibraryMappingEdit = 'DENY_LIBRARY_MAPPING_EDIT',
  OwnLibraryBorrowing = 'OWN_LIBRARY_BORROWING',
  PickupAnywhere = 'PICKUP_ANYWHERE',
  ReResolution = 'RE_RESOLUTION',
  SelectUnavailableItems = 'SELECT_UNAVAILABLE_ITEMS',
  TriggerSupplierRenewal = 'TRIGGER_SUPPLIER_RENEWAL',
  VirtualPatronNamesPolaris = 'VIRTUAL_PATRON_NAMES_POLARIS',
  VirtualPatronNamesVisible = 'VIRTUAL_PATRON_NAMES_VISIBLE'
}

export type HostLms = {
  __typename?: 'HostLms';
  clientConfig?: Maybe<Scalars['JSON']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  itemSuppressionRulesetName?: Maybe<Scalars['String']['output']>;
  lmsClientClass?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  suppressionRulesetName?: Maybe<Scalars['String']['output']>;
};

export type HostLmsPage = {
  __typename?: 'HostLmsPage';
  content?: Maybe<Array<Maybe<HostLms>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type InactiveSupplierRequest = {
  __typename?: 'InactiveSupplierRequest';
  canonicalItemType?: Maybe<Scalars['String']['output']>;
  dateCreated?: Maybe<Scalars['String']['output']>;
  dateUpdated?: Maybe<Scalars['String']['output']>;
  hostLmsCode?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  localAgency?: Maybe<Scalars['String']['output']>;
  localBibId?: Maybe<Scalars['String']['output']>;
  localHoldingId?: Maybe<Scalars['String']['output']>;
  localId?: Maybe<Scalars['String']['output']>;
  localItemBarcode?: Maybe<Scalars['String']['output']>;
  localItemId?: Maybe<Scalars['String']['output']>;
  localItemLocationCode?: Maybe<Scalars['String']['output']>;
  localItemStatus?: Maybe<Scalars['String']['output']>;
  localItemType?: Maybe<Scalars['String']['output']>;
  localRenewalCount?: Maybe<Scalars['Int']['output']>;
  localStatus?: Maybe<Scalars['String']['output']>;
  patronRequest?: Maybe<PatronRequest>;
  rawLocalItemStatus?: Maybe<Scalars['String']['output']>;
  rawLocalStatus?: Maybe<Scalars['String']['output']>;
  virtualPatron?: Maybe<PatronIdentity>;
};

export type InactiveSupplierRequestPage = {
  __typename?: 'InactiveSupplierRequestPage';
  content?: Maybe<Array<Maybe<InactiveSupplierRequest>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type Library = {
  __typename?: 'Library';
  abbreviatedName?: Maybe<Scalars['String']['output']>;
  address?: Maybe<Scalars['String']['output']>;
  agency?: Maybe<Agency>;
  agencyCode?: Maybe<Scalars['String']['output']>;
  backupDowntimeSchedule?: Maybe<Scalars['String']['output']>;
  contacts?: Maybe<Array<Maybe<Person>>>;
  discoverySystem?: Maybe<Scalars['String']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
  hostLmsConfiguration?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  membership?: Maybe<Array<Maybe<LibraryGroupMember>>>;
  patronWebsite?: Maybe<Scalars['String']['output']>;
  principalLabel?: Maybe<Scalars['String']['output']>;
  secondHostLms?: Maybe<HostLms>;
  secretLabel?: Maybe<Scalars['String']['output']>;
  shortName?: Maybe<Scalars['String']['output']>;
  supportHours?: Maybe<Scalars['String']['output']>;
  targetLoanToBorrowRatio?: Maybe<Scalars['String']['output']>;
  training?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type LibraryContact = {
  __typename?: 'LibraryContact';
  id?: Maybe<Scalars['ID']['output']>;
  library?: Maybe<Library>;
  person?: Maybe<Person>;
};

export type LibraryGroup = {
  __typename?: 'LibraryGroup';
  code: Scalars['String']['output'];
  consortium?: Maybe<Consortium>;
  id: Scalars['ID']['output'];
  members?: Maybe<Array<Maybe<LibraryGroupMember>>>;
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type LibraryGroupInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type LibraryGroupMember = {
  __typename?: 'LibraryGroupMember';
  id: Scalars['ID']['output'];
  library?: Maybe<Library>;
  libraryGroup?: Maybe<LibraryGroup>;
};

export type LibraryGroupPage = {
  __typename?: 'LibraryGroupPage';
  content?: Maybe<Array<Maybe<LibraryGroup>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type LibraryInput = {
  abbreviatedName: Scalars['String']['input'];
  address: Scalars['String']['input'];
  agencyCode: Scalars['String']['input'];
  authProfile?: InputMaybe<Scalars['String']['input']>;
  backupDowntimeSchedule?: InputMaybe<Scalars['String']['input']>;
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  contacts: Array<InputMaybe<PersonInput>>;
  discoverySystem?: InputMaybe<Scalars['String']['input']>;
  fullName: Scalars['String']['input'];
  hostLmsCode: Scalars['String']['input'];
  hostLmsConfiguration?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isBorrowingAgency?: InputMaybe<Scalars['Boolean']['input']>;
  isSupplyingAgency?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  maxConsortialLoans?: InputMaybe<Scalars['Int']['input']>;
  patronWebsite?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  shortName: Scalars['String']['input'];
  supportHours?: InputMaybe<Scalars['String']['input']>;
  targetLoanToBorrowRatio?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type LibraryPage = {
  __typename?: 'LibraryPage';
  content?: Maybe<Array<Maybe<Library>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type Location = {
  __typename?: 'Location';
  agency?: Maybe<Agency>;
  code?: Maybe<Scalars['String']['output']>;
  dateCreated?: Maybe<Scalars['String']['output']>;
  dateUpdated?: Maybe<Scalars['String']['output']>;
  deliveryStops?: Maybe<Scalars['String']['output']>;
  hostSystem?: Maybe<HostLms>;
  id: Scalars['ID']['output'];
  isEnabledForPickupAnywhere?: Maybe<Scalars['Boolean']['output']>;
  isPickup?: Maybe<Scalars['Boolean']['output']>;
  lastImported?: Maybe<Scalars['String']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  localId?: Maybe<Scalars['String']['output']>;
  locationReference?: Maybe<Scalars['String']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  parentLocation?: Maybe<Location>;
  printLabel?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type LocationPage = {
  __typename?: 'LocationPage';
  content?: Maybe<Array<Maybe<Location>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type MatchPoint = {
  __typename?: 'MatchPoint';
  bibId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  value: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addAgencyToGroup: AgencyGroupMember;
  addLibraryToGroup: LibraryGroupMember;
  createAgencyGroup: AgencyGroup;
  createConsortium: Consortium;
  createContact: ConsortiumContact;
  createFunctionalSetting: FunctionalSetting;
  createHostLms?: Maybe<CreateHostLmsResult>;
  createLibrary: Library;
  createLibraryContact: LibraryContact;
  createLibraryGroup: LibraryGroup;
  createLocation: Location;
  createReferenceValueMapping: ReferenceValueMapping;
  createRole: Role;
  deleteConsortium: DeleteEntityPayload;
  deleteContact: DeleteEntityPayload;
  deleteLibrary: DeleteEntityPayload;
  deleteLibraryContact: DeleteEntityPayload;
  deleteLocation: DeleteEntityPayload;
  deleteNumericRangeMapping: DeleteEntityPayload;
  deleteReferenceValueMapping: DeleteEntityPayload;
  updateAgency: Agency;
  updateAgencyParticipationStatus: Agency;
  updateConsortialMaxLoans: Agency;
  updateConsortium: Consortium;
  updateFunctionalSetting: FunctionalSetting;
  updateHostLms?: Maybe<UpdateHostLmsResult>;
  updateLibrary: Library;
  updateLocation: Location;
  updateNumericRangeMapping: NumericRangeMapping;
  updatePerson: Person;
  updateReferenceValueMapping: ReferenceValueMapping;
  updateRole: Role;
};


export type MutationAddAgencyToGroupArgs = {
  input?: InputMaybe<AddAgencyToGroupCommand>;
};


export type MutationAddLibraryToGroupArgs = {
  input?: InputMaybe<AddLibraryToGroupCommand>;
};


export type MutationCreateAgencyGroupArgs = {
  input?: InputMaybe<AgencyGroupInput>;
};


export type MutationCreateConsortiumArgs = {
  input?: InputMaybe<ConsortiumInput>;
};


export type MutationCreateContactArgs = {
  input?: InputMaybe<ConsortiumContactInput>;
};


export type MutationCreateFunctionalSettingArgs = {
  input?: InputMaybe<FunctionalSettingInput>;
};


export type MutationCreateHostLmsArgs = {
  input: CreateHostLmsInput;
};


export type MutationCreateLibraryArgs = {
  input?: InputMaybe<LibraryInput>;
};


export type MutationCreateLibraryContactArgs = {
  input?: InputMaybe<CreateLibraryContactInput>;
};


export type MutationCreateLibraryGroupArgs = {
  input?: InputMaybe<LibraryGroupInput>;
};


export type MutationCreateLocationArgs = {
  input?: InputMaybe<CreateLocationInput>;
};


export type MutationCreateReferenceValueMappingArgs = {
  input?: InputMaybe<CreateReferenceValueMappingInput>;
};


export type MutationCreateRoleArgs = {
  input?: InputMaybe<CreateRoleInput>;
};


export type MutationDeleteConsortiumArgs = {
  input?: InputMaybe<DeleteEntityInput>;
};


export type MutationDeleteContactArgs = {
  input?: InputMaybe<DeleteConsortiumContactInput>;
};


export type MutationDeleteLibraryArgs = {
  input?: InputMaybe<DeleteEntityInput>;
};


export type MutationDeleteLibraryContactArgs = {
  input?: InputMaybe<DeleteLibraryContactInput>;
};


export type MutationDeleteLocationArgs = {
  input?: InputMaybe<DeleteEntityInput>;
};


export type MutationDeleteNumericRangeMappingArgs = {
  input?: InputMaybe<DeleteEntityInput>;
};


export type MutationDeleteReferenceValueMappingArgs = {
  input?: InputMaybe<DeleteEntityInput>;
};


export type MutationUpdateAgencyArgs = {
  input?: InputMaybe<UpdateAgencyInput>;
};


export type MutationUpdateAgencyParticipationStatusArgs = {
  input?: InputMaybe<UpdateAgencyParticipationInput>;
};


export type MutationUpdateConsortialMaxLoansArgs = {
  input?: InputMaybe<UpdateConsortialMaxLoansInput>;
};


export type MutationUpdateConsortiumArgs = {
  input?: InputMaybe<UpdateConsortiumInput>;
};


export type MutationUpdateFunctionalSettingArgs = {
  input?: InputMaybe<UpdateFunctionalSettingInput>;
};


export type MutationUpdateHostLmsArgs = {
  input: UpdateHostLmsInput;
};


export type MutationUpdateLibraryArgs = {
  input?: InputMaybe<UpdateLibraryInput>;
};


export type MutationUpdateLocationArgs = {
  input?: InputMaybe<UpdateLocationInput>;
};


export type MutationUpdateNumericRangeMappingArgs = {
  input?: InputMaybe<UpdateNumericRangeMappingInput>;
};


export type MutationUpdatePersonArgs = {
  input?: InputMaybe<UpdatePersonInput>;
};


export type MutationUpdateReferenceValueMappingArgs = {
  input?: InputMaybe<UpdateReferenceValueMappingInput>;
};


export type MutationUpdateRoleArgs = {
  input?: InputMaybe<UpdateRoleInput>;
};

export type NumericRangeMapping = {
  __typename?: 'NumericRangeMapping';
  context?: Maybe<Scalars['String']['output']>;
  deleted?: Maybe<Scalars['Boolean']['output']>;
  domain?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastImported?: Maybe<Scalars['String']['output']>;
  lowerBound?: Maybe<Scalars['Int']['output']>;
  mappedValue?: Maybe<Scalars['String']['output']>;
  targetContext?: Maybe<Scalars['String']['output']>;
  upperBound?: Maybe<Scalars['Int']['output']>;
};

export type NumericRangeMappingPage = {
  __typename?: 'NumericRangeMappingPage';
  content?: Maybe<Array<Maybe<NumericRangeMapping>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

/** See: https://micronaut-projects.github.io/micronaut-data/2.4.0/api/io/micronaut/data/model/Page.html */
export type Pageable = {
  __typename?: 'Pageable';
  number?: Maybe<Scalars['Int']['output']>;
  offset?: Maybe<Scalars['Int']['output']>;
};

export type Patron = {
  __typename?: 'Patron';
  id: Scalars['ID']['output'];
};

export type PatronIdentity = {
  __typename?: 'PatronIdentity';
  canonicalPtype?: Maybe<Scalars['String']['output']>;
  homeIdentity?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  lastValidated?: Maybe<Scalars['String']['output']>;
  localBarcode?: Maybe<Scalars['String']['output']>;
  localHomeLibraryCode?: Maybe<Scalars['String']['output']>;
  localId?: Maybe<Scalars['String']['output']>;
  localNames?: Maybe<Scalars['String']['output']>;
  localPtype?: Maybe<Scalars['String']['output']>;
};

export type PatronIdentityPage = {
  __typename?: 'PatronIdentityPage';
  content?: Maybe<Array<Maybe<PatronIdentity>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type PatronRequest = {
  __typename?: 'PatronRequest';
  activeWorkflow?: Maybe<Scalars['String']['output']>;
  audit?: Maybe<Array<Maybe<PatronRequestAudit>>>;
  autoPollCountForCurrentStatus?: Maybe<Scalars['Int']['output']>;
  bibClusterId?: Maybe<Scalars['ID']['output']>;
  clusterRecord?: Maybe<ClusterRecord>;
  currentStatusTimestamp?: Maybe<Scalars['String']['output']>;
  dateCreated?: Maybe<Scalars['String']['output']>;
  dateUpdated?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  elapsedTimeInCurrentStatus?: Maybe<Scalars['Float']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isExpeditedCheckout?: Maybe<Scalars['Boolean']['output']>;
  isManuallySelectedItem?: Maybe<Scalars['Boolean']['output']>;
  isTooLong?: Maybe<Scalars['Boolean']['output']>;
  localBibId?: Maybe<Scalars['String']['output']>;
  localHoldingId?: Maybe<Scalars['String']['output']>;
  localItemAgencyCode?: Maybe<Scalars['String']['output']>;
  localItemHostlmsCode?: Maybe<Scalars['String']['output']>;
  localItemId?: Maybe<Scalars['String']['output']>;
  localItemStatus?: Maybe<Scalars['String']['output']>;
  localItemType?: Maybe<Scalars['String']['output']>;
  localRenewalCount?: Maybe<Scalars['Int']['output']>;
  localRequestId?: Maybe<Scalars['String']['output']>;
  localRequestStatus?: Maybe<Scalars['String']['output']>;
  manualPollCountForCurrentStatus?: Maybe<Scalars['Int']['output']>;
  nextExpectedStatus?: Maybe<Scalars['String']['output']>;
  nextScheduledPoll?: Maybe<Scalars['String']['output']>;
  outOfSequenceFlag?: Maybe<Scalars['Boolean']['output']>;
  patron?: Maybe<Patron>;
  patronHostlmsCode?: Maybe<Scalars['String']['output']>;
  pickupBibId?: Maybe<Scalars['String']['output']>;
  pickupHoldingId?: Maybe<Scalars['String']['output']>;
  pickupItemBarcode?: Maybe<Scalars['String']['output']>;
  pickupItemId?: Maybe<Scalars['String']['output']>;
  pickupItemStatus?: Maybe<Scalars['String']['output']>;
  pickupItemType?: Maybe<Scalars['String']['output']>;
  pickupLocationCode?: Maybe<Scalars['String']['output']>;
  pickupPatronId?: Maybe<Scalars['String']['output']>;
  pickupRequestId?: Maybe<Scalars['String']['output']>;
  pickupRequestStatus?: Maybe<Scalars['String']['output']>;
  pollCountForCurrentStatus?: Maybe<Scalars['Int']['output']>;
  previousStatus?: Maybe<Scalars['String']['output']>;
  protocol?: Maybe<Scalars['String']['output']>;
  rawLocalItemStatus?: Maybe<Scalars['String']['output']>;
  rawLocalRequestStatus?: Maybe<Scalars['String']['output']>;
  rawPickupItemStatus?: Maybe<Scalars['String']['output']>;
  rawPickupRequestStatus?: Maybe<Scalars['String']['output']>;
  renewalCount?: Maybe<Scalars['Int']['output']>;
  renewalStatus?: Maybe<RenewalStatus>;
  requesterNote?: Maybe<Scalars['String']['output']>;
  requestingIdentity?: Maybe<PatronIdentity>;
  resolutionCount?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  suppliers?: Maybe<Array<Maybe<SupplierRequest>>>;
};

export type PatronRequestAudit = {
  __typename?: 'PatronRequestAudit';
  auditData?: Maybe<Scalars['JSON']['output']>;
  auditDate?: Maybe<Scalars['String']['output']>;
  briefDescription?: Maybe<Scalars['String']['output']>;
  fromStatus?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  patronRequest?: Maybe<PatronRequest>;
  toStatus?: Maybe<Scalars['String']['output']>;
};

export type PatronRequestAuditPage = {
  __typename?: 'PatronRequestAuditPage';
  content?: Maybe<Array<Maybe<PatronRequestAudit>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type PatronRequestPage = {
  __typename?: 'PatronRequestPage';
  content?: Maybe<Array<Maybe<PatronRequest>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type Person = {
  __typename?: 'Person';
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isPrimaryContact?: Maybe<Scalars['Boolean']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  role: Role;
};

export type PersonInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  id?: InputMaybe<Scalars['ID']['input']>;
  isPrimaryContact: Scalars['Boolean']['input'];
  lastName: Scalars['String']['input'];
  role: Scalars['String']['input'];
};

export type ProcessState = {
  __typename?: 'ProcessState';
  context?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  processName?: Maybe<Scalars['String']['output']>;
  processState?: Maybe<Scalars['JSON']['output']>;
};

export type ProcessStatePage = {
  __typename?: 'ProcessStatePage';
  content?: Maybe<Array<Maybe<ProcessState>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export enum ProcessingStatus {
  Failure = 'FAILURE',
  ProcessingRequired = 'PROCESSING_REQUIRED',
  Success = 'SUCCESS'
}

export type Query = {
  __typename?: 'Query';
  agencies: AgencyPage;
  agencyGroups: AgencyGroupPage;
  alarms: AlarmPage;
  audits: PatronRequestAuditPage;
  consortia: ConsortiumPage;
  dataChangeLog: DataChangeLogPage;
  functionalSettings: FunctionalSettingPage;
  hostLms: HostLmsPage;
  inactiveSupplierRequests: InactiveSupplierRequestPage;
  instanceClusters: ClusterRecordPage;
  libraries: LibraryPage;
  libraryGroupMembers: Array<Maybe<LibraryGroupMember>>;
  libraryGroups: LibraryGroupPage;
  locations: LocationPage;
  numericRangeMappings: NumericRangeMappingPage;
  patronIdentities: PatronIdentityPage;
  patronRequestStatistics: Array<Maybe<DailyPatronRequestStat>>;
  patronRequests?: Maybe<PatronRequestPage>;
  pickupLocations?: Maybe<Array<Maybe<Location>>>;
  processStates: ProcessStatePage;
  referenceValueMappings: ReferenceValueMappingPage;
  roles: RolePage;
  sourceBibs: BibRecordPage;
  supplierRequests: SupplierRequestPage;
};


export type QueryAgenciesArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAgencyGroupsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAlarmsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAuditsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryConsortiaArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDataChangeLogArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFunctionalSettingsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryHostLmsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryInactiveSupplierRequestsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryInstanceClustersArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLibrariesArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLibraryGroupsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLocationsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryNumericRangeMappingsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPatronIdentitiesArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPatronRequestStatisticsArgs = {
  bibClusterId?: InputMaybe<Scalars['ID']['input']>;
  borrowerCodes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  pickupCodes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  statusCodes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  supplierCodes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryPatronRequestsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPickupLocationsArgs = {
  forAgency?: InputMaybe<Scalars['String']['input']>;
};


export type QueryProcessStatesArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryReferenceValueMappingsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryRolesArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySourceBibsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySupplierRequestsArgs = {
  order?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};

/** Used in ingest v1. Note that sourceRecordId is also legacy - source record UUID is the one for ingest v2 and later */
export type RawSource = {
  __typename?: 'RawSource';
  hostLmsId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  json?: Maybe<Scalars['JSON']['output']>;
  remoteId?: Maybe<Scalars['String']['output']>;
};

export type ReferenceValueMapping = {
  __typename?: 'ReferenceValueMapping';
  deleted?: Maybe<Scalars['Boolean']['output']>;
  fromCategory?: Maybe<Scalars['String']['output']>;
  fromContext?: Maybe<Scalars['String']['output']>;
  fromValue?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  lastImported?: Maybe<Scalars['String']['output']>;
  reciprocal?: Maybe<Scalars['Boolean']['output']>;
  toCategory?: Maybe<Scalars['String']['output']>;
  toContext?: Maybe<Scalars['String']['output']>;
  toValue?: Maybe<Scalars['String']['output']>;
};

export type ReferenceValueMappingPage = {
  __typename?: 'ReferenceValueMappingPage';
  content?: Maybe<Array<Maybe<ReferenceValueMapping>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export enum RenewalStatus {
  Allowed = 'ALLOWED',
  Disallowed = 'DISALLOWED',
  Unknown = 'UNKNOWN',
  Unsupported = 'UNSUPPORTED'
}

export type Role = {
  __typename?: 'Role';
  description?: Maybe<Scalars['String']['output']>;
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  keycloakRole?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type RolePage = {
  __typename?: 'RolePage';
  content?: Maybe<Array<Maybe<Role>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

/** Used in ingest v2 */
export type SourceRecord = {
  __typename?: 'SourceRecord';
  hostLmsId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  lastFetched: Scalars['String']['output'];
  lastProcessed?: Maybe<Scalars['String']['output']>;
  processingInformation?: Maybe<Scalars['String']['output']>;
  processingState?: Maybe<ProcessingStatus>;
  remoteId: Scalars['String']['output'];
  sourceRecordData?: Maybe<Scalars['JSON']['output']>;
};

export type SupplierRequest = {
  __typename?: 'SupplierRequest';
  canonicalItemType?: Maybe<Scalars['String']['output']>;
  dateCreated?: Maybe<Scalars['String']['output']>;
  dateUpdated?: Maybe<Scalars['String']['output']>;
  hostLmsCode?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive?: Maybe<Scalars['Boolean']['output']>;
  localAgency?: Maybe<Scalars['String']['output']>;
  localBibId?: Maybe<Scalars['String']['output']>;
  localHoldCount?: Maybe<Scalars['Int']['output']>;
  localHoldingId?: Maybe<Scalars['String']['output']>;
  localId?: Maybe<Scalars['String']['output']>;
  localItemBarcode?: Maybe<Scalars['String']['output']>;
  localItemId?: Maybe<Scalars['String']['output']>;
  localItemLocationCode?: Maybe<Scalars['String']['output']>;
  localItemStatus?: Maybe<Scalars['String']['output']>;
  localItemType?: Maybe<Scalars['String']['output']>;
  localRenewable?: Maybe<Scalars['Boolean']['output']>;
  localRenewalCount?: Maybe<Scalars['Int']['output']>;
  localStatus?: Maybe<Scalars['String']['output']>;
  patronRequest?: Maybe<PatronRequest>;
  rawLocalItemStatus?: Maybe<Scalars['String']['output']>;
  rawLocalStatus?: Maybe<Scalars['String']['output']>;
  virtualPatron?: Maybe<PatronIdentity>;
};

export type SupplierRequestPage = {
  __typename?: 'SupplierRequestPage';
  content?: Maybe<Array<Maybe<SupplierRequest>>>;
  pageable?: Maybe<Pageable>;
  totalSize?: Maybe<Scalars['Int']['output']>;
};

export type UpdateAgencyInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  isBorrowingAgency?: InputMaybe<Scalars['Boolean']['input']>;
  isSupplyingAgency?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  maxConsortialLoans?: InputMaybe<Scalars['Int']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAgencyParticipationInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  isBorrowingAgency?: InputMaybe<Scalars['Boolean']['input']>;
  isSupplyingAgency?: InputMaybe<Scalars['Boolean']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateConsortialMaxLoansInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['String']['input'];
  maxLoans: Scalars['Int']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateConsortiumInput = {
  aboutImageUploader?: InputMaybe<Scalars['String']['input']>;
  aboutImageUploaderEmail?: InputMaybe<Scalars['String']['input']>;
  aboutImageUrl?: InputMaybe<Scalars['String']['input']>;
  catalogueSearchUrl?: InputMaybe<Scalars['String']['input']>;
  changeCategory: Scalars['String']['input'];
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  contacts?: InputMaybe<Array<InputMaybe<UpdatePersonInput>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  headerImageUploader?: InputMaybe<Scalars['String']['input']>;
  headerImageUploaderEmail?: InputMaybe<Scalars['String']['input']>;
  headerImageUrl?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
  websiteUrl?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateFunctionalSettingInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<FunctionalSettingType>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateHostLmsInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  clientConfig?: InputMaybe<Scalars['JSON']['input']>;
  id: Scalars['ID']['input'];
  ingestSourceClass?: InputMaybe<Scalars['String']['input']>;
  itemSuppressionRulesetName?: InputMaybe<Scalars['String']['input']>;
  lmsClientClass?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  suppressionRulesetName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateHostLmsResult = {
  __typename?: 'UpdateHostLmsResult';
  hostLms?: Maybe<HostLms>;
  ingestStatus?: Maybe<Scalars['String']['output']>;
  pingStatus?: Maybe<Scalars['String']['output']>;
  warnings?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type UpdateLibraryInput = {
  abbreviatedName?: InputMaybe<Scalars['String']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  backupDowntimeSchedule?: InputMaybe<Scalars['String']['input']>;
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  discoverySystem?: InputMaybe<Scalars['String']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  patronWebsite?: InputMaybe<Scalars['String']['input']>;
  principalLabel?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  secretLabel?: InputMaybe<Scalars['String']['input']>;
  shortName?: InputMaybe<Scalars['String']['input']>;
  supportHours?: InputMaybe<Scalars['String']['input']>;
  targetLoanToBorrowRatio?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLocationInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isEnabledForPickupAnywhere?: InputMaybe<Scalars['Boolean']['input']>;
  isPickup?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  localId?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  printLabel?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateNumericRangeMappingInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  mappedValue?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePersonInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isPrimaryContact?: InputMaybe<Scalars['Boolean']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateReferenceValueMappingInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRoleInput = {
  changeCategory?: InputMaybe<Scalars['String']['input']>;
  changeReferenceUrl?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  keycloakRole?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type AddLibraryToGroupMutationVariables = Exact<{
  input: AddLibraryToGroupCommand;
}>;


export type AddLibraryToGroupMutation = { __typename?: 'Mutation', addLibraryToGroup: { __typename?: 'LibraryGroupMember', id: string, library?: { __typename?: 'Library', id: string, agencyCode?: string | null, fullName?: string | null } | null, libraryGroup?: { __typename?: 'LibraryGroup', id: string, code: string, name: string, type: string } | null } };

export type CreateLibraryMutationVariables = Exact<{
  input: LibraryInput;
}>;


export type CreateLibraryMutation = { __typename?: 'Mutation', createLibrary: { __typename?: 'Library', id: string, fullName?: string | null, type?: string | null } };

export type CreateLibraryContactMutationVariables = Exact<{
  input: CreateLibraryContactInput;
}>;


export type CreateLibraryContactMutation = { __typename?: 'Mutation', createLibraryContact: { __typename?: 'LibraryContact', id?: string | null, person?: { __typename?: 'Person', firstName?: string | null, lastName?: string | null } | null, library?: { __typename?: 'Library', id: string } | null } };

export type CreateLibraryGroupMutationVariables = Exact<{
  input: LibraryGroupInput;
}>;


export type CreateLibraryGroupMutation = { __typename?: 'Mutation', createLibraryGroup: { __typename?: 'LibraryGroup', id: string, code: string, name: string, type: string } };

export type CreateLocationMutationVariables = Exact<{
  input: CreateLocationInput;
}>;


export type CreateLocationMutation = { __typename?: 'Mutation', createLocation: { __typename?: 'Location', id: string, name?: string | null } };

export type CreateReferenceValueMappingMutationVariables = Exact<{
  input: CreateReferenceValueMappingInput;
}>;


export type CreateReferenceValueMappingMutation = { __typename?: 'Mutation', createReferenceValueMapping: { __typename?: 'ReferenceValueMapping', id: string, toValue?: string | null } };

export type DeleteLibraryMutationVariables = Exact<{
  input: DeleteEntityInput;
}>;


export type DeleteLibraryMutation = { __typename?: 'Mutation', deleteLibrary: { __typename?: 'DeleteEntityPayload', success: boolean, message?: string | null } };

export type DeleteLibraryContactMutationVariables = Exact<{
  input: DeleteLibraryContactInput;
}>;


export type DeleteLibraryContactMutation = { __typename?: 'Mutation', deleteLibraryContact: { __typename?: 'DeleteEntityPayload', success: boolean, message?: string | null } };

export type DeleteLocationMutationVariables = Exact<{
  input: DeleteEntityInput;
}>;


export type DeleteLocationMutation = { __typename?: 'Mutation', deleteLocation: { __typename?: 'DeleteEntityPayload', success: boolean, message?: string | null } };

export type DeleteNumericRangeMappingMutationVariables = Exact<{
  input: DeleteEntityInput;
}>;


export type DeleteNumericRangeMappingMutation = { __typename?: 'Mutation', deleteNumericRangeMapping: { __typename?: 'DeleteEntityPayload', success: boolean, message?: string | null } };

export type DeleteReferenceValueMappingMutationVariables = Exact<{
  input: DeleteEntityInput;
}>;


export type DeleteReferenceValueMappingMutation = { __typename?: 'Mutation', deleteReferenceValueMapping: { __typename?: 'DeleteEntityPayload', success: boolean, message?: string | null } };

export type UpdateAgencyMutationVariables = Exact<{
  input: UpdateAgencyInput;
}>;


export type UpdateAgencyMutation = { __typename?: 'Mutation', updateAgency: { __typename?: 'Agency', id?: string | null, code?: string | null, name?: string | null, isSupplyingAgency?: boolean | null, isBorrowingAgency?: boolean | null, maxConsortialLoans?: number | null } };

export type UpdateAgencyParticipationStatusMutationVariables = Exact<{
  input: UpdateAgencyParticipationInput;
}>;


export type UpdateAgencyParticipationStatusMutation = { __typename?: 'Mutation', updateAgencyParticipationStatus: { __typename?: 'Agency', id?: string | null, code?: string | null, name?: string | null, isSupplyingAgency?: boolean | null, isBorrowingAgency?: boolean | null } };

export type UpdateLibraryMutationVariables = Exact<{
  input: UpdateLibraryInput;
}>;


export type UpdateLibraryMutation = { __typename?: 'Mutation', updateLibrary: { __typename?: 'Library', id: string, fullName?: string | null, shortName?: string | null, abbreviatedName?: string | null, backupDowntimeSchedule?: string | null, supportHours?: string | null, latitude?: number | null, longitude?: number | null } };

export type UpdateLocationMutationVariables = Exact<{
  input: UpdateLocationInput;
}>;


export type UpdateLocationMutation = { __typename?: 'Mutation', updateLocation: { __typename?: 'Location', id: string, longitude?: number | null, latitude?: number | null, name?: string | null, localId?: string | null, printLabel?: string | null, isPickup?: boolean | null, isEnabledForPickupAnywhere?: boolean | null } };

export type UpdateNumericRangeMappingMutationVariables = Exact<{
  input: UpdateNumericRangeMappingInput;
}>;


export type UpdateNumericRangeMappingMutation = { __typename?: 'Mutation', updateNumericRangeMapping: { __typename?: 'NumericRangeMapping', id: string, mappedValue?: string | null } };

export type UpdatePersonMutationVariables = Exact<{
  input: UpdatePersonInput;
}>;


export type UpdatePersonMutation = { __typename?: 'Mutation', updatePerson: { __typename?: 'Person', id?: string | null, email?: string | null, firstName?: string | null, lastName?: string | null, isPrimaryContact?: boolean | null, role: { __typename?: 'Role', id: string, name: string, displayName: string } } };

export type UpdateReferenceValueMappingMutationVariables = Exact<{
  input: UpdateReferenceValueMappingInput;
}>;


export type UpdateReferenceValueMappingMutation = { __typename?: 'Mutation', updateReferenceValueMapping: { __typename?: 'ReferenceValueMapping', id: string, toValue?: string | null } };

export type CheckExistingMappingsQueryVariables = Exact<{
  pagesize: Scalars['Int']['input'];
  query: Scalars['String']['input'];
}>;


export type CheckExistingMappingsQuery = { __typename?: 'Query', referenceValueMappings: { __typename?: 'ReferenceValueMappingPage', totalSize?: number | null, content?: Array<{ __typename?: 'ReferenceValueMapping', id: string, fromCategory?: string | null, fromContext?: string | null, fromValue?: string | null, toCategory?: string | null, toContext?: string | null, toValue?: string | null, reciprocal?: boolean | null, label?: string | null, lastImported?: string | null, deleted?: boolean | null } | null> | null } };

export type CheckExistingNumericRangeMappingsQueryVariables = Exact<{
  pagesize: Scalars['Int']['input'];
  query: Scalars['String']['input'];
}>;


export type CheckExistingNumericRangeMappingsQuery = { __typename?: 'Query', numericRangeMappings: { __typename?: 'NumericRangeMappingPage', totalSize?: number | null, content?: Array<{ __typename?: 'NumericRangeMapping', id: string, context?: string | null, domain?: string | null, lowerBound?: number | null, upperBound?: number | null, targetContext?: string | null, mappedValue?: string | null, deleted?: boolean | null, lastImported?: string | null } | null> | null } };

export type LoadAgenciesQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadAgenciesQuery = { __typename?: 'Query', agencies: { __typename?: 'AgencyPage', content?: Array<{ __typename?: 'Agency', id?: string | null, code?: string | null, name?: string | null, authProfile?: string | null, longitude?: number | null, latitude?: number | null, isSupplyingAgency?: boolean | null, isBorrowingAgency?: boolean | null, hostLms?: { __typename?: 'HostLms', id?: string | null, code?: string | null, name?: string | null, lmsClientClass?: string | null, clientConfig?: any | null } | null, locations?: Array<{ __typename?: 'Location', id: string, dateCreated?: string | null, dateUpdated?: string | null, code?: string | null, name?: string | null, type?: string | null, isPickup?: boolean | null, isEnabledForPickupAnywhere?: boolean | null, longitude?: number | null, latitude?: number | null, locationReference?: string | null, deliveryStops?: string | null, printLabel?: string | null, localId?: string | null } | null> | null } | null> | null } };

export type GetAuditByIdQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type GetAuditByIdQuery = { __typename?: 'Query', audits: { __typename?: 'PatronRequestAuditPage', content?: Array<{ __typename?: 'PatronRequestAudit', id: string, auditDate?: string | null, briefDescription?: string | null, fromStatus?: string | null, toStatus?: string | null, auditData?: any | null, patronRequest?: { __typename?: 'PatronRequest', id: string } | null } | null> | null } };

export type GetAuditsByPatronRequestQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type GetAuditsByPatronRequestQuery = { __typename?: 'Query', audits: { __typename?: 'PatronRequestAuditPage', totalSize?: number | null, content?: Array<{ __typename?: 'PatronRequestAudit', id: string, auditDate?: string | null, briefDescription?: string | null, auditData?: any | null, patronRequest?: { __typename?: 'PatronRequest', id: string } | null } | null> | null } };

export type LoadBibMainDetailsQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadBibMainDetailsQuery = { __typename?: 'Query', sourceBibs: { __typename?: 'BibRecordPage', content?: Array<{ __typename?: 'BibRecord', id: string, dateCreated?: string | null, dateUpdated?: string | null, title?: string | null, author?: string | null, canonicalMetadata?: any | null, processVersion?: number | null, metadataScore?: number | null, placeOfPublication?: string | null, publisher?: string | null, dateOfPublication?: string | null, edition?: string | null, isLargePrint?: boolean | null, clusterReason?: string | null, typeOfRecord?: string | null, sourceSystemId?: string | null, sourceRecordId?: string | null, contributesTo?: { __typename?: 'ClusterRecord', id: string, title?: string | null } | null, matchPoints?: Array<{ __typename?: 'MatchPoint', id: string, bibId: string, value: string } | null> | null } | null> | null } };

export type LoadBibSourceRecordQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadBibSourceRecordQuery = { __typename?: 'Query', sourceBibs: { __typename?: 'BibRecordPage', content?: Array<{ __typename?: 'BibRecord', sourceRecord?: { __typename?: 'SourceRecord', id: string, hostLmsId: string, remoteId: string, lastFetched: string, lastProcessed?: string | null, processingState?: ProcessingStatus | null, processingInformation?: string | null, sourceRecordData?: any | null } | null } | null> | null } };

export type LoadBibsQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
}>;


export type LoadBibsQuery = { __typename?: 'Query', sourceBibs: { __typename?: 'BibRecordPage', totalSize?: number | null, content?: Array<{ __typename?: 'BibRecord', id: string, dateCreated?: string | null, dateUpdated?: string | null, title?: string | null, author?: string | null, sourceSystemId?: string | null, sourceRecordId?: string | null, processVersion?: number | null, isLargePrint?: boolean | null, contributesTo?: { __typename?: 'ClusterRecord', id: string } | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } };

export type LoadBibsForPublisherQueryVariables = Exact<{
  query: Scalars['String']['input'];
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
}>;


export type LoadBibsForPublisherQuery = { __typename?: 'Query', sourceBibs: { __typename?: 'BibRecordPage', content?: Array<{ __typename?: 'BibRecord', contributesTo?: { __typename?: 'ClusterRecord', id: string } | null } | null> | null } };

export type LoadClusterIdsByTitleQueryVariables = Exact<{
  query: Scalars['String']['input'];
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
}>;


export type LoadClusterIdsByTitleQuery = { __typename?: 'Query', sourceBibs: { __typename?: 'BibRecordPage', content?: Array<{ __typename?: 'BibRecord', contributesTo?: { __typename?: 'ClusterRecord', id: string } | null } | null> | null } };

export type ClusterRecordsQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type ClusterRecordsQuery = { __typename?: 'Query', instanceClusters: { __typename?: 'ClusterRecordPage', content?: Array<{ __typename?: 'ClusterRecord', id: string, title?: string | null, selectedBib?: string | null, isDeleted?: boolean | null, dateCreated?: string | null, dateUpdated?: string | null, lastIndexed?: string | null, members?: Array<{ __typename?: 'BibRecord', id: string, title?: string | null, author?: string | null, typeOfRecord?: string | null, canonicalMetadata?: any | null, clusterReason?: string | null, sourceSystemId?: string | null, sourceRecordId?: string | null, sourceRecord?: { __typename?: 'SourceRecord', id: string, hostLmsId: string, remoteId: string, lastFetched: string, lastProcessed?: string | null, processingState?: ProcessingStatus | null, processingInformation?: string | null, sourceRecordData?: any | null } | null, matchPoints?: Array<{ __typename?: 'MatchPoint', id: string, value: string } | null> | null } | null> | null } | null> | null } };

export type ClusterRecordsTitleOnlyQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type ClusterRecordsTitleOnlyQuery = { __typename?: 'Query', instanceClusters: { __typename?: 'ClusterRecordPage', content?: Array<{ __typename?: 'ClusterRecord', id: string, title?: string | null, selectedBib?: string | null, isDeleted?: boolean | null, dateCreated?: string | null, dateUpdated?: string | null } | null> | null } };

export type LoadGroupQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadGroupQuery = { __typename?: 'Query', libraryGroups: { __typename?: 'LibraryGroupPage', content?: Array<{ __typename?: 'LibraryGroup', id: string, code: string, name: string, type: string, consortium?: { __typename?: 'Consortium', id: string, name: string } | null, members?: Array<{ __typename?: 'LibraryGroupMember', id: string, library?: { __typename?: 'Library', id: string, agencyCode?: string | null, shortName?: string | null, fullName?: string | null, abbreviatedName?: string | null, longitude?: number | null, latitude?: number | null, agency?: { __typename?: 'Agency', authProfile?: string | null, code?: string | null, id?: string | null, isBorrowingAgency?: boolean | null, isSupplyingAgency?: boolean | null, hostLms?: { __typename?: 'HostLms', lmsClientClass?: string | null, code?: string | null, id?: string | null } | null } | null } | null } | null> | null } | null> | null } };

export type LoadGroupsSelectionQueryVariables = Exact<{
  order: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadGroupsSelectionQuery = { __typename?: 'Query', libraryGroups: { __typename?: 'LibraryGroupPage', totalSize?: number | null, content?: Array<{ __typename?: 'LibraryGroup', id: string, code: string, name: string, type: string } | null> | null } };

export type LoadHostLmsQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadHostLmsQuery = { __typename?: 'Query', hostLms: { __typename?: 'HostLmsPage', content?: Array<{ __typename?: 'HostLms', id?: string | null, code?: string | null, name?: string | null, lmsClientClass?: string | null, clientConfig?: any | null, itemSuppressionRulesetName?: string | null, suppressionRulesetName?: string | null } | null> | null } };

export type LoadLibrariesQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadLibrariesQuery = { __typename?: 'Query', libraries: { __typename?: 'LibraryPage', totalSize?: number | null, content?: Array<{ __typename?: 'Library', id: string, fullName?: string | null, shortName?: string | null, abbreviatedName?: string | null, agencyCode?: string | null, supportHours?: string | null, address?: string | null, type?: string | null, agency?: { __typename?: 'Agency', id?: string | null, code?: string | null, name?: string | null, authProfile?: string | null, isSupplyingAgency?: boolean | null, isBorrowingAgency?: boolean | null, hostLms?: { __typename?: 'HostLms', id?: string | null, code?: string | null, clientConfig?: any | null, lmsClientClass?: string | null } | null } | null, secondHostLms?: { __typename?: 'HostLms', id?: string | null, code?: string | null, clientConfig?: any | null, lmsClientClass?: string | null } | null, membership?: Array<{ __typename?: 'LibraryGroupMember', libraryGroup?: { __typename?: 'LibraryGroup', id: string, code: string, name: string, type: string, consortium?: { __typename?: 'Consortium', id: string, name: string, dateOfLaunch?: string | null, functionalSettings?: Array<{ __typename?: 'FunctionalSetting', id: string, name: FunctionalSettingType, enabled: boolean } | null> | null } | null } | null } | null> | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } };

export type LoadLibraryQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadLibraryQuery = { __typename?: 'Query', libraries: { __typename?: 'LibraryPage', content?: Array<{ __typename?: 'Library', id: string, fullName?: string | null, shortName?: string | null, abbreviatedName?: string | null, agencyCode?: string | null, supportHours?: string | null, address?: string | null, latitude?: number | null, longitude?: number | null, training?: boolean | null, patronWebsite?: string | null, discoverySystem?: string | null, type?: string | null, backupDowntimeSchedule?: string | null, hostLmsConfiguration?: string | null, agency?: { __typename?: 'Agency', id?: string | null, code?: string | null, name?: string | null, authProfile?: string | null, isSupplyingAgency?: boolean | null, isBorrowingAgency?: boolean | null, hostLms?: { __typename?: 'HostLms', id?: string | null, code?: string | null, name?: string | null, clientConfig?: any | null, lmsClientClass?: string | null, itemSuppressionRulesetName?: string | null, suppressionRulesetName?: string | null } | null } | null, secondHostLms?: { __typename?: 'HostLms', id?: string | null, code?: string | null, name?: string | null, clientConfig?: any | null, lmsClientClass?: string | null, itemSuppressionRulesetName?: string | null, suppressionRulesetName?: string | null } | null, membership?: Array<{ __typename?: 'LibraryGroupMember', libraryGroup?: { __typename?: 'LibraryGroup', id: string, code: string, name: string, type: string, consortium?: { __typename?: 'Consortium', id: string, name: string, functionalSettings?: Array<{ __typename?: 'FunctionalSetting', id: string, name: FunctionalSettingType, enabled: boolean } | null> | null } | null } | null } | null> | null, contacts?: Array<{ __typename?: 'Person', id?: string | null, firstName?: string | null, lastName?: string | null, isPrimaryContact?: boolean | null, email?: string | null, role: { __typename?: 'Role', id: string, name: string, description?: string | null, displayName: string, keycloakRole?: string | null } } | null> | null } | null> | null } };

export type LoadLibraryBasicsQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadLibraryBasicsQuery = { __typename?: 'Query', libraries: { __typename?: 'LibraryPage', content?: Array<{ __typename?: 'Library', id: string, fullName?: string | null, shortName?: string | null, agencyCode?: string | null, contacts?: Array<{ __typename?: 'Person', id?: string | null, firstName?: string | null, lastName?: string | null, isPrimaryContact?: boolean | null, email?: string | null, role: { __typename?: 'Role', id: string, name: string, description?: string | null, displayName: string, keycloakRole?: string | null } } | null> | null, agency?: { __typename?: 'Agency', id?: string | null, code?: string | null, maxConsortialLoans?: number | null, hostLms?: { __typename?: 'HostLms', id?: string | null, code?: string | null, lmsClientClass?: string | null } | null } | null, secondHostLms?: { __typename?: 'HostLms', code?: string | null, name?: string | null, id?: string | null, lmsClientClass?: string | null } | null } | null> | null } };

export type LoadLibraryServiceInfoQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadLibraryServiceInfoQuery = { __typename?: 'Query', libraries: { __typename?: 'LibraryPage', content?: Array<{ __typename?: 'Library', id: string, fullName?: string | null, agencyCode?: string | null, agency?: { __typename?: 'Agency', id?: string | null, authProfile?: string | null, hostLms?: { __typename?: 'HostLms', id?: string | null, code?: string | null, name?: string | null } | null } | null } | null> | null } };

export type LoadLibraryBibClusterIdsQueryVariables = Exact<{
  query: Scalars['String']['input'];
  pagesize?: InputMaybe<Scalars['Int']['input']>;
  pageno?: InputMaybe<Scalars['Int']['input']>;
}>;


export type LoadLibraryBibClusterIdsQuery = { __typename?: 'Query', patronRequests?: { __typename?: 'PatronRequestPage', content?: Array<{ __typename?: 'PatronRequest', bibClusterId?: string | null, clusterRecord?: { __typename?: 'ClusterRecord', title?: string | null, members?: Array<{ __typename?: 'BibRecord', publisher?: string | null } | null> | null } | null } | null> | null } | null };

export type LoadGroupsQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadGroupsQuery = { __typename?: 'Query', libraryGroups: { __typename?: 'LibraryGroupPage', totalSize?: number | null, content?: Array<{ __typename?: 'LibraryGroup', id: string, code: string, name: string, type: string, consortium?: { __typename?: 'Consortium', name: string, id: string } | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } };

export type LoadLocationQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadLocationQuery = { __typename?: 'Query', locations: { __typename?: 'LocationPage', content?: Array<{ __typename?: 'Location', id: string, code?: string | null, name?: string | null, type?: string | null, isPickup?: boolean | null, isEnabledForPickupAnywhere?: boolean | null, localId?: string | null, longitude?: number | null, latitude?: number | null, printLabel?: string | null, deliveryStops?: string | null, locationReference?: string | null, dateCreated?: string | null, dateUpdated?: string | null, agency?: { __typename?: 'Agency', id?: string | null, code?: string | null, name?: string | null, authProfile?: string | null, longitude?: number | null, latitude?: number | null } | null, parentLocation?: { __typename?: 'Location', id: string, code?: string | null, name?: string | null, type?: string | null, isPickup?: boolean | null, isEnabledForPickupAnywhere?: boolean | null, longitude?: number | null, latitude?: number | null, dateCreated?: string | null, dateUpdated?: string | null, hostSystem?: { __typename?: 'HostLms', id?: string | null, code?: string | null, name?: string | null, lmsClientClass?: string | null, clientConfig?: any | null } | null } | null, hostSystem?: { __typename?: 'HostLms', id?: string | null, code?: string | null, name?: string | null, lmsClientClass?: string | null, clientConfig?: any | null } | null } | null> | null } };

export type LoadLocationForPrGridQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadLocationForPrGridQuery = { __typename?: 'Query', locations: { __typename?: 'LocationPage', totalSize?: number | null, content?: Array<{ __typename?: 'Location', id: string, code?: string | null, name?: string | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } };

export type LoadLocationsQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadLocationsQuery = { __typename?: 'Query', locations: { __typename?: 'LocationPage', totalSize?: number | null, content?: Array<{ __typename?: 'Location', id: string, code?: string | null, name?: string | null, type?: string | null, isPickup?: boolean | null, isEnabledForPickupAnywhere?: boolean | null, printLabel?: string | null, localId?: string | null, deliveryStops?: string | null, lastImported?: string | null, latitude?: number | null, longitude?: number | null, agency?: { __typename?: 'Agency', id?: string | null, name?: string | null, code?: string | null } | null, hostSystem?: { __typename?: 'HostLms', name?: string | null } | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } };

export type LoadMappingsQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadMappingsQuery = { __typename?: 'Query', referenceValueMappings: { __typename?: 'ReferenceValueMappingPage', totalSize?: number | null, content?: Array<{ __typename?: 'ReferenceValueMapping', id: string, fromCategory?: string | null, fromContext?: string | null, fromValue?: string | null, toCategory?: string | null, toContext?: string | null, toValue?: string | null, reciprocal?: boolean | null, label?: string | null, lastImported?: string | null, deleted?: boolean | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } };

export type LoadNumericRangeMappingsQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
  query: Scalars['String']['input'];
}>;


export type LoadNumericRangeMappingsQuery = { __typename?: 'Query', numericRangeMappings: { __typename?: 'NumericRangeMappingPage', totalSize?: number | null, content?: Array<{ __typename?: 'NumericRangeMapping', id: string, context?: string | null, domain?: string | null, lowerBound?: number | null, upperBound?: number | null, targetContext?: string | null, mappedValue?: string | null, lastImported?: string | null, deleted?: boolean | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } };

export type LoadPatronIdentitiesQueryVariables = Exact<{
  order: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadPatronIdentitiesQuery = { __typename?: 'Query', patronIdentities: { __typename?: 'PatronIdentityPage', totalSize?: number | null, content?: Array<{ __typename?: 'PatronIdentity', id: string, localId?: string | null, homeIdentity?: boolean | null, localBarcode?: string | null, localNames?: string | null, localPtype?: string | null, canonicalPtype?: string | null, localHomeLibraryCode?: string | null, lastValidated?: string | null } | null> | null } };

export type LoadPatronRequestQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadPatronRequestQuery = { __typename?: 'Query', patronRequests?: { __typename?: 'PatronRequestPage', content?: Array<{ __typename?: 'PatronRequest', id: string, dateUpdated?: string | null, patronHostlmsCode?: string | null, bibClusterId?: string | null, pickupLocationCode?: string | null, pickupPatronId?: string | null, pickupItemId?: string | null, pickupItemType?: string | null, pickupItemStatus?: string | null, pickupRequestId?: string | null, pickupRequestStatus?: string | null, status?: string | null, localRequestId?: string | null, localRequestStatus?: string | null, localItemId?: string | null, localItemStatus?: string | null, localItemType?: string | null, isExpeditedCheckout?: boolean | null, localBibId?: string | null, rawLocalItemStatus?: string | null, rawLocalRequestStatus?: string | null, description?: string | null, nextScheduledPoll?: string | null, errorMessage?: string | null, previousStatus?: string | null, pollCountForCurrentStatus?: number | null, currentStatusTimestamp?: string | null, nextExpectedStatus?: string | null, outOfSequenceFlag?: boolean | null, elapsedTimeInCurrentStatus?: number | null, localItemHostlmsCode?: string | null, localItemAgencyCode?: string | null, isManuallySelectedItem?: boolean | null, resolutionCount?: number | null, renewalCount?: number | null, renewalStatus?: RenewalStatus | null, localRenewalCount?: number | null, dateCreated?: string | null, activeWorkflow?: string | null, requesterNote?: string | null, patron?: { __typename?: 'Patron', id: string } | null, requestingIdentity?: { __typename?: 'PatronIdentity', id: string, localId?: string | null, homeIdentity?: boolean | null, localBarcode?: string | null, localNames?: string | null, localPtype?: string | null, canonicalPtype?: string | null, localHomeLibraryCode?: string | null, lastValidated?: string | null } | null, audit?: Array<{ __typename?: 'PatronRequestAudit', id: string, auditDate?: string | null, briefDescription?: string | null, fromStatus?: string | null, toStatus?: string | null, auditData?: any | null } | null> | null, clusterRecord?: { __typename?: 'ClusterRecord', id: string, title?: string | null, selectedBib?: string | null, isDeleted?: boolean | null, dateCreated?: string | null, dateUpdated?: string | null, members?: Array<{ __typename?: 'BibRecord', id: string, dateCreated?: string | null, dateUpdated?: string | null, title?: string | null, author?: string | null, placeOfPublication?: string | null, publisher?: string | null, dateOfPublication?: string | null, edition?: string | null, isLargePrint?: boolean | null, clusterReason?: string | null, typeOfRecord?: string | null, canonicalMetadata?: any | null, metadataScore?: number | null, processVersion?: number | null, sourceSystemId?: string | null, sourceRecordId?: string | null, sourceRecord?: { __typename?: 'SourceRecord', id: string, hostLmsId: string, remoteId: string, lastFetched: string, lastProcessed?: string | null, processingState?: ProcessingStatus | null, processingInformation?: string | null, sourceRecordData?: any | null } | null } | null> | null } | null, suppliers?: Array<{ __typename?: 'SupplierRequest', id: string, canonicalItemType?: string | null, dateCreated?: string | null, dateUpdated?: string | null, hostLmsCode?: string | null, isActive?: boolean | null, localItemId?: string | null, localBibId?: string | null, localItemBarcode?: string | null, localItemLocationCode?: string | null, localItemStatus?: string | null, localItemType?: string | null, localId?: string | null, localRenewalCount?: number | null, localStatus?: string | null, localAgency?: string | null, rawLocalItemStatus?: string | null, rawLocalStatus?: string | null, virtualPatron?: { __typename?: 'PatronIdentity', id: string, localId?: string | null, homeIdentity?: boolean | null, localBarcode?: string | null, localNames?: string | null, localPtype?: string | null, canonicalPtype?: string | null, localHomeLibraryCode?: string | null, lastValidated?: string | null } | null } | null> | null } | null> | null } | null };

export type LoadPatronRequestsByIdQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type LoadPatronRequestsByIdQuery = { __typename?: 'Query', patronRequests?: { __typename?: 'PatronRequestPage', content?: Array<{ __typename?: 'PatronRequest', id: string, dateUpdated?: string | null, patronHostlmsCode?: string | null, bibClusterId?: string | null, status?: string | null, localRequestId?: string | null, localRequestStatus?: string | null, localItemId?: string | null, localItemStatus?: string | null, localItemType?: string | null, localBibId?: string | null, rawLocalItemStatus?: string | null, rawLocalRequestStatus?: string | null, description?: string | null, nextScheduledPoll?: string | null, errorMessage?: string | null, previousStatus?: string | null, pollCountForCurrentStatus?: number | null, currentStatusTimestamp?: string | null, nextExpectedStatus?: string | null, outOfSequenceFlag?: boolean | null, elapsedTimeInCurrentStatus?: number | null, localItemHostlmsCode?: string | null, localItemAgencyCode?: string | null, isManuallySelectedItem?: boolean | null, resolutionCount?: number | null, renewalCount?: number | null, renewalStatus?: RenewalStatus | null, localRenewalCount?: number | null, dateCreated?: string | null, activeWorkflow?: string | null, requesterNote?: string | null } | null> | null } | null };

export type LoadPatronRequestStatsQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadPatronRequestStatsQuery = { __typename?: 'Query', patronRequests?: { __typename?: 'PatronRequestPage', totalSize?: number | null, content?: Array<{ __typename?: 'PatronRequest', id: string, dateCreated?: string | null, dateUpdated?: string | null, patronHostlmsCode?: string | null, suppliers?: Array<{ __typename?: 'SupplierRequest', localAgency?: string | null, canonicalItemType?: string | null } | null> | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } | null };

export type LoadPatronRequestTotalsQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadPatronRequestTotalsQuery = { __typename?: 'Query', patronRequests?: { __typename?: 'PatronRequestPage', totalSize?: number | null, content?: Array<{ __typename?: 'PatronRequest', id: string, dateCreated?: string | null, dateUpdated?: string | null, status?: string | null, patronHostlmsCode?: string | null, isExpeditedCheckout?: boolean | null, outOfSequenceFlag?: boolean | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } | null };

export type LoadPatronRequestsQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadPatronRequestsQuery = { __typename?: 'Query', patronRequests?: { __typename?: 'PatronRequestPage', totalSize?: number | null, content?: Array<{ __typename?: 'PatronRequest', id: string, dateCreated?: string | null, dateUpdated?: string | null, patronHostlmsCode?: string | null, pickupLocationCode?: string | null, description?: string | null, status?: string | null, previousStatus?: string | null, nextExpectedStatus?: string | null, errorMessage?: string | null, nextScheduledPoll?: string | null, outOfSequenceFlag?: boolean | null, elapsedTimeInCurrentStatus?: number | null, pollCountForCurrentStatus?: number | null, isManuallySelectedItem?: boolean | null, requesterNote?: string | null, activeWorkflow?: string | null, rawLocalRequestStatus?: string | null, rawLocalItemStatus?: string | null, localRequestId?: string | null, localRequestStatus?: string | null, localItemId?: string | null, localItemStatus?: string | null, localItemType?: string | null, patron?: { __typename?: 'Patron', id: string } | null, requestingIdentity?: { __typename?: 'PatronIdentity', id: string, localId?: string | null, localBarcode?: string | null, canonicalPtype?: string | null } | null, suppliers?: Array<{ __typename?: 'SupplierRequest', localAgency?: string | null, canonicalItemType?: string | null, localItemBarcode?: string | null } | null> | null, clusterRecord?: { __typename?: 'ClusterRecord', id: string, title?: string | null, members?: Array<{ __typename?: 'BibRecord', publisher?: string | null } | null> | null } | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } | null };

export type LoadPatronRequestsForExportQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadPatronRequestsForExportQuery = { __typename?: 'Query', patronRequests?: { __typename?: 'PatronRequestPage', totalSize?: number | null, content?: Array<{ __typename?: 'PatronRequest', id: string, dateCreated?: string | null, dateUpdated?: string | null, patronHostlmsCode?: string | null, pickupLocationCode?: string | null, description?: string | null, status?: string | null, previousStatus?: string | null, nextExpectedStatus?: string | null, errorMessage?: string | null, outOfSequenceFlag?: boolean | null, elapsedTimeInCurrentStatus?: number | null, pollCountForCurrentStatus?: number | null, isManuallySelectedItem?: boolean | null, requesterNote?: string | null, activeWorkflow?: string | null, pickupRequestId?: string | null, pickupRequestStatus?: string | null, pickupItemId?: string | null, isExpeditedCheckout?: boolean | null, rawLocalRequestStatus?: string | null, rawLocalItemStatus?: string | null, localRequestId?: string | null, localRequestStatus?: string | null, localItemId?: string | null, localItemStatus?: string | null, localItemType?: string | null, patron?: { __typename?: 'Patron', id: string } | null, requestingIdentity?: { __typename?: 'PatronIdentity', localBarcode?: string | null, canonicalPtype?: string | null } | null, suppliers?: Array<{ __typename?: 'SupplierRequest', localAgency?: string | null, canonicalItemType?: string | null, localItemBarcode?: string | null, localItemType?: string | null } | null> | null, clusterRecord?: { __typename?: 'ClusterRecord', title?: string | null } | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } | null };

export type LoadRolesQueryVariables = Exact<{
  order: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
  pagesize: Scalars['Int']['input'];
}>;


export type LoadRolesQuery = { __typename?: 'Query', roles: { __typename?: 'RolePage', totalSize?: number | null, content?: Array<{ __typename?: 'Role', id: string, name: string, keycloakRole?: string | null, description?: string | null, displayName: string } | null> | null } };

export type LoadSupplierRequestsQueryVariables = Exact<{
  pageno: Scalars['Int']['input'];
  pagesize: Scalars['Int']['input'];
  order: Scalars['String']['input'];
  query: Scalars['String']['input'];
  orderBy: Scalars['String']['input'];
}>;


export type LoadSupplierRequestsQuery = { __typename?: 'Query', supplierRequests: { __typename?: 'SupplierRequestPage', totalSize?: number | null, content?: Array<{ __typename?: 'SupplierRequest', id: string, canonicalItemType?: string | null, dateCreated?: string | null, dateUpdated?: string | null, hostLmsCode?: string | null, isActive?: boolean | null, localItemId?: string | null, localBibId?: string | null, localItemBarcode?: string | null, localItemLocationCode?: string | null, localItemStatus?: string | null, localItemType?: string | null, localId?: string | null, localStatus?: string | null, localAgency?: string | null, rawLocalItemStatus?: string | null, rawLocalStatus?: string | null, localRenewalCount?: number | null, virtualPatron?: { __typename?: 'PatronIdentity', id: string, localId?: string | null, homeIdentity?: boolean | null, localBarcode?: string | null, localNames?: string | null, localPtype?: string | null, canonicalPtype?: string | null, localHomeLibraryCode?: string | null, lastValidated?: string | null } | null, patronRequest?: { __typename?: 'PatronRequest', id: string } | null } | null> | null, pageable?: { __typename?: 'Pageable', number?: number | null, offset?: number | null } | null } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const AddLibraryToGroupDocument = new TypedDocumentString(`
    mutation addLibraryToGroup($input: AddLibraryToGroupCommand!) {
  addLibraryToGroup(input: $input) {
    id
    library {
      id
      agencyCode
      fullName
    }
    libraryGroup {
      id
      code
      name
      type
    }
  }
}
    `) as unknown as TypedDocumentString<AddLibraryToGroupMutation, AddLibraryToGroupMutationVariables>;
export const CreateLibraryDocument = new TypedDocumentString(`
    mutation CreateLibrary($input: LibraryInput!) {
  createLibrary(input: $input) {
    id
    fullName
    type
  }
}
    `) as unknown as TypedDocumentString<CreateLibraryMutation, CreateLibraryMutationVariables>;
export const CreateLibraryContactDocument = new TypedDocumentString(`
    mutation CreateLibraryContact($input: CreateLibraryContactInput!) {
  createLibraryContact(input: $input) {
    id
    person {
      firstName
      lastName
    }
    library {
      id
    }
  }
}
    `) as unknown as TypedDocumentString<CreateLibraryContactMutation, CreateLibraryContactMutationVariables>;
export const CreateLibraryGroupDocument = new TypedDocumentString(`
    mutation CreateLibraryGroup($input: LibraryGroupInput!) {
  createLibraryGroup(input: $input) {
    id
    code
    name
    type
  }
}
    `) as unknown as TypedDocumentString<CreateLibraryGroupMutation, CreateLibraryGroupMutationVariables>;
export const CreateLocationDocument = new TypedDocumentString(`
    mutation CreateLocation($input: CreateLocationInput!) {
  createLocation(input: $input) {
    id
    name
  }
}
    `) as unknown as TypedDocumentString<CreateLocationMutation, CreateLocationMutationVariables>;
export const CreateReferenceValueMappingDocument = new TypedDocumentString(`
    mutation CreateReferenceValueMapping($input: CreateReferenceValueMappingInput!) {
  createReferenceValueMapping(input: $input) {
    id
    toValue
  }
}
    `) as unknown as TypedDocumentString<CreateReferenceValueMappingMutation, CreateReferenceValueMappingMutationVariables>;
export const DeleteLibraryDocument = new TypedDocumentString(`
    mutation DeleteLibrary($input: DeleteEntityInput!) {
  deleteLibrary(input: $input) {
    success
    message
  }
}
    `) as unknown as TypedDocumentString<DeleteLibraryMutation, DeleteLibraryMutationVariables>;
export const DeleteLibraryContactDocument = new TypedDocumentString(`
    mutation DeleteLibraryContact($input: DeleteLibraryContactInput!) {
  deleteLibraryContact(input: $input) {
    success
    message
  }
}
    `) as unknown as TypedDocumentString<DeleteLibraryContactMutation, DeleteLibraryContactMutationVariables>;
export const DeleteLocationDocument = new TypedDocumentString(`
    mutation DeleteLocation($input: DeleteEntityInput!) {
  deleteLocation(input: $input) {
    success
    message
  }
}
    `) as unknown as TypedDocumentString<DeleteLocationMutation, DeleteLocationMutationVariables>;
export const DeleteNumericRangeMappingDocument = new TypedDocumentString(`
    mutation DeleteNumericRangeMapping($input: DeleteEntityInput!) {
  deleteNumericRangeMapping(input: $input) {
    success
    message
  }
}
    `) as unknown as TypedDocumentString<DeleteNumericRangeMappingMutation, DeleteNumericRangeMappingMutationVariables>;
export const DeleteReferenceValueMappingDocument = new TypedDocumentString(`
    mutation DeleteReferenceValueMapping($input: DeleteEntityInput!) {
  deleteReferenceValueMapping(input: $input) {
    success
    message
  }
}
    `) as unknown as TypedDocumentString<DeleteReferenceValueMappingMutation, DeleteReferenceValueMappingMutationVariables>;
export const UpdateAgencyDocument = new TypedDocumentString(`
    mutation UpdateAgency($input: UpdateAgencyInput!) {
  updateAgency(input: $input) {
    id
    code
    name
    isSupplyingAgency
    isBorrowingAgency
    maxConsortialLoans
  }
}
    `) as unknown as TypedDocumentString<UpdateAgencyMutation, UpdateAgencyMutationVariables>;
export const UpdateAgencyParticipationStatusDocument = new TypedDocumentString(`
    mutation UpdateAgencyParticipationStatus($input: UpdateAgencyParticipationInput!) {
  updateAgencyParticipationStatus(input: $input) {
    id
    code
    name
    isSupplyingAgency
    isBorrowingAgency
  }
}
    `) as unknown as TypedDocumentString<UpdateAgencyParticipationStatusMutation, UpdateAgencyParticipationStatusMutationVariables>;
export const UpdateLibraryDocument = new TypedDocumentString(`
    mutation UpdateLibrary($input: UpdateLibraryInput!) {
  updateLibrary(input: $input) {
    id
    fullName
    shortName
    abbreviatedName
    backupDowntimeSchedule
    supportHours
    latitude
    longitude
  }
}
    `) as unknown as TypedDocumentString<UpdateLibraryMutation, UpdateLibraryMutationVariables>;
export const UpdateLocationDocument = new TypedDocumentString(`
    mutation UpdateLocation($input: UpdateLocationInput!) {
  updateLocation(input: $input) {
    id
    longitude
    latitude
    name
    localId
    printLabel
    isPickup
    isEnabledForPickupAnywhere
  }
}
    `) as unknown as TypedDocumentString<UpdateLocationMutation, UpdateLocationMutationVariables>;
export const UpdateNumericRangeMappingDocument = new TypedDocumentString(`
    mutation UpdateNumericRangeMapping($input: UpdateNumericRangeMappingInput!) {
  updateNumericRangeMapping(input: $input) {
    id
    mappedValue
  }
}
    `) as unknown as TypedDocumentString<UpdateNumericRangeMappingMutation, UpdateNumericRangeMappingMutationVariables>;
export const UpdatePersonDocument = new TypedDocumentString(`
    mutation UpdatePerson($input: UpdatePersonInput!) {
  updatePerson(input: $input) {
    id
    email
    firstName
    lastName
    role {
      id
      name
      displayName
    }
    isPrimaryContact
  }
}
    `) as unknown as TypedDocumentString<UpdatePersonMutation, UpdatePersonMutationVariables>;
export const UpdateReferenceValueMappingDocument = new TypedDocumentString(`
    mutation UpdateReferenceValueMapping($input: UpdateReferenceValueMappingInput!) {
  updateReferenceValueMapping(input: $input) {
    id
    toValue
  }
}
    `) as unknown as TypedDocumentString<UpdateReferenceValueMappingMutation, UpdateReferenceValueMappingMutationVariables>;
export const CheckExistingMappingsDocument = new TypedDocumentString(`
    query CheckExistingMappings($pagesize: Int!, $query: String!) {
  referenceValueMappings(pagesize: $pagesize, query: $query) {
    totalSize
    content {
      id
      fromCategory
      fromContext
      fromValue
      toCategory
      toContext
      toValue
      reciprocal
      label
      lastImported
      deleted
    }
  }
}
    `) as unknown as TypedDocumentString<CheckExistingMappingsQuery, CheckExistingMappingsQueryVariables>;
export const CheckExistingNumericRangeMappingsDocument = new TypedDocumentString(`
    query CheckExistingNumericRangeMappings($pagesize: Int!, $query: String!) {
  numericRangeMappings(pagesize: $pagesize, query: $query) {
    totalSize
    content {
      id
      context
      domain
      lowerBound
      upperBound
      targetContext
      mappedValue
      deleted
      lastImported
    }
  }
}
    `) as unknown as TypedDocumentString<CheckExistingNumericRangeMappingsQuery, CheckExistingNumericRangeMappingsQueryVariables>;
export const LoadAgenciesDocument = new TypedDocumentString(`
    query LoadAgencies($query: String!) {
  agencies(query: $query) {
    content {
      id
      code
      name
      authProfile
      longitude
      latitude
      isSupplyingAgency
      isBorrowingAgency
      hostLms {
        id
        code
        name
        lmsClientClass
        clientConfig
      }
      locations {
        id
        dateCreated
        dateUpdated
        code
        name
        type
        isPickup
        isEnabledForPickupAnywhere
        longitude
        latitude
        locationReference
        deliveryStops
        printLabel
        localId
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadAgenciesQuery, LoadAgenciesQueryVariables>;
export const GetAuditByIdDocument = new TypedDocumentString(`
    query GetAuditById($query: String!) {
  audits(query: $query) {
    content {
      id
      auditDate
      briefDescription
      fromStatus
      toStatus
      auditData
      patronRequest {
        id
      }
    }
  }
}
    `) as unknown as TypedDocumentString<GetAuditByIdQuery, GetAuditByIdQueryVariables>;
export const GetAuditsByPatronRequestDocument = new TypedDocumentString(`
    query GetAuditsByPatronRequest($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  audits(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    totalSize
    content {
      id
      auditDate
      briefDescription
      auditData
      patronRequest {
        id
      }
    }
  }
}
    `) as unknown as TypedDocumentString<GetAuditsByPatronRequestQuery, GetAuditsByPatronRequestQueryVariables>;
export const LoadBibMainDetailsDocument = new TypedDocumentString(`
    query LoadBibMainDetails($query: String!) {
  sourceBibs(query: $query) {
    content {
      id
      dateCreated
      dateUpdated
      title
      author
      canonicalMetadata
      processVersion
      metadataScore
      processVersion
      placeOfPublication
      publisher
      dateOfPublication
      edition
      isLargePrint
      clusterReason
      typeOfRecord
      metadataScore
      contributesTo {
        id
        title
      }
      sourceSystemId
      sourceRecordId
      matchPoints {
        id
        bibId
        value
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadBibMainDetailsQuery, LoadBibMainDetailsQueryVariables>;
export const LoadBibSourceRecordDocument = new TypedDocumentString(`
    query LoadBibSourceRecord($query: String!) {
  sourceBibs(query: $query) {
    content {
      sourceRecord {
        id
        hostLmsId
        remoteId
        lastFetched
        lastProcessed
        processingState
        processingInformation
        sourceRecordData
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadBibSourceRecordQuery, LoadBibSourceRecordQueryVariables>;
export const LoadBibsDocument = new TypedDocumentString(`
    query LoadBibs($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!) {
  sourceBibs(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query) {
    totalSize
    content {
      id
      dateCreated
      dateUpdated
      title
      author
      sourceSystemId
      sourceRecordId
      processVersion
      isLargePrint
      contributesTo {
        id
      }
    }
    pageable {
      number
      offset
    }
  }
}
    `) as unknown as TypedDocumentString<LoadBibsQuery, LoadBibsQueryVariables>;
export const LoadBibsForPublisherDocument = new TypedDocumentString(`
    query LoadBibsForPublisher($query: String!, $pagesize: Int, $pageno: Int) {
  sourceBibs(query: $query, pagesize: $pagesize, pageno: $pageno) {
    content {
      contributesTo {
        id
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadBibsForPublisherQuery, LoadBibsForPublisherQueryVariables>;
export const LoadClusterIdsByTitleDocument = new TypedDocumentString(`
    query LoadClusterIdsByTitle($query: String!, $pagesize: Int, $pageno: Int) {
  sourceBibs(query: $query, pagesize: $pagesize, pageno: $pageno) {
    content {
      contributesTo {
        id
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadClusterIdsByTitleQuery, LoadClusterIdsByTitleQueryVariables>;
export const ClusterRecordsDocument = new TypedDocumentString(`
    query ClusterRecords($query: String!) {
  instanceClusters(query: $query) {
    content {
      id
      title
      selectedBib
      isDeleted
      dateCreated
      dateUpdated
      lastIndexed
      members {
        id
        title
        author
        typeOfRecord
        canonicalMetadata
        clusterReason
        sourceSystemId
        sourceRecordId
        sourceRecord {
          id
          hostLmsId
          remoteId
          lastFetched
          lastProcessed
          processingState
          processingInformation
          sourceRecordData
        }
        matchPoints {
          id
          value
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<ClusterRecordsQuery, ClusterRecordsQueryVariables>;
export const ClusterRecordsTitleOnlyDocument = new TypedDocumentString(`
    query ClusterRecordsTitleOnly($query: String!) {
  instanceClusters(query: $query) {
    content {
      id
      title
      selectedBib
      isDeleted
      dateCreated
      dateUpdated
    }
  }
}
    `) as unknown as TypedDocumentString<ClusterRecordsTitleOnlyQuery, ClusterRecordsTitleOnlyQueryVariables>;
export const LoadGroupDocument = new TypedDocumentString(`
    query LoadGroup($query: String!) {
  libraryGroups(query: $query) {
    content {
      id
      code
      name
      type
      consortium {
        id
        name
      }
      members {
        id
        library {
          id
          agencyCode
          agency {
            authProfile
            code
            id
            isBorrowingAgency
            isSupplyingAgency
            hostLms {
              lmsClientClass
              code
              id
            }
          }
          shortName
          fullName
          abbreviatedName
          longitude
          latitude
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadGroupQuery, LoadGroupQueryVariables>;
export const LoadGroupsSelectionDocument = new TypedDocumentString(`
    query LoadGroupsSelection($order: String!, $orderBy: String!) {
  libraryGroups(order: $order, orderBy: $orderBy) {
    totalSize
    content {
      id
      code
      name
      type
    }
  }
}
    `) as unknown as TypedDocumentString<LoadGroupsSelectionQuery, LoadGroupsSelectionQueryVariables>;
export const LoadHostLmsDocument = new TypedDocumentString(`
    query LoadHostLms($query: String!) {
  hostLms(query: $query) {
    content {
      id
      code
      name
      lmsClientClass
      clientConfig
      itemSuppressionRulesetName
      suppressionRulesetName
    }
  }
}
    `) as unknown as TypedDocumentString<LoadHostLmsQuery, LoadHostLmsQueryVariables>;
export const LoadLibrariesDocument = new TypedDocumentString(`
    query LoadLibraries($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  libraries(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    content {
      id
      fullName
      shortName
      abbreviatedName
      agencyCode
      supportHours
      address
      type
      agency {
        id
        code
        name
        authProfile
        hostLms {
          id
          code
          clientConfig
          lmsClientClass
        }
        isSupplyingAgency
        isBorrowingAgency
      }
      secondHostLms {
        id
        code
        clientConfig
        lmsClientClass
      }
      membership {
        libraryGroup {
          id
          code
          name
          type
          consortium {
            id
            name
            dateOfLaunch
            functionalSettings {
              id
              name
              enabled
            }
          }
        }
      }
    }
    pageable {
      number
      offset
    }
    totalSize
  }
}
    `) as unknown as TypedDocumentString<LoadLibrariesQuery, LoadLibrariesQueryVariables>;
export const LoadLibraryDocument = new TypedDocumentString(`
    query LoadLibrary($query: String!) {
  libraries(query: $query) {
    content {
      id
      fullName
      shortName
      abbreviatedName
      agencyCode
      supportHours
      address
      latitude
      longitude
      training
      patronWebsite
      discoverySystem
      type
      backupDowntimeSchedule
      hostLmsConfiguration
      agency {
        id
        code
        name
        authProfile
        isSupplyingAgency
        isBorrowingAgency
        hostLms {
          id
          code
          name
          clientConfig
          lmsClientClass
          itemSuppressionRulesetName
          suppressionRulesetName
        }
      }
      secondHostLms {
        id
        code
        name
        clientConfig
        lmsClientClass
        itemSuppressionRulesetName
        suppressionRulesetName
      }
      membership {
        libraryGroup {
          id
          code
          name
          type
          consortium {
            id
            name
            functionalSettings {
              id
              name
              enabled
            }
          }
        }
      }
      contacts {
        id
        firstName
        lastName
        role {
          id
          name
          description
          displayName
          keycloakRole
        }
        isPrimaryContact
        email
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadLibraryQuery, LoadLibraryQueryVariables>;
export const LoadLibraryBasicsDocument = new TypedDocumentString(`
    query LoadLibraryBasics($query: String!) {
  libraries(query: $query) {
    content {
      id
      fullName
      shortName
      agencyCode
      contacts {
        id
        firstName
        lastName
        role {
          id
          name
          description
          displayName
          keycloakRole
        }
        isPrimaryContact
        email
      }
      agency {
        id
        code
        maxConsortialLoans
        hostLms {
          id
          code
          lmsClientClass
        }
      }
      secondHostLms {
        code
        name
        id
        lmsClientClass
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadLibraryBasicsQuery, LoadLibraryBasicsQueryVariables>;
export const LoadLibraryServiceInfoDocument = new TypedDocumentString(`
    query LoadLibraryServiceInfo($query: String!) {
  libraries(query: $query) {
    content {
      id
      fullName
      agencyCode
      agency {
        id
        authProfile
        hostLms {
          id
          code
          name
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadLibraryServiceInfoQuery, LoadLibraryServiceInfoQueryVariables>;
export const LoadLibraryBibClusterIdsDocument = new TypedDocumentString(`
    query LoadLibraryBibClusterIds($query: String!, $pagesize: Int, $pageno: Int) {
  patronRequests(query: $query, pagesize: $pagesize, pageno: $pageno) {
    content {
      bibClusterId
      clusterRecord {
        title
        members {
          publisher
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadLibraryBibClusterIdsQuery, LoadLibraryBibClusterIdsQueryVariables>;
export const LoadGroupsDocument = new TypedDocumentString(`
    query LoadGroups($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  libraryGroups(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    totalSize
    content {
      id
      code
      name
      type
      consortium {
        name
        id
      }
    }
    pageable {
      number
      offset
    }
  }
}
    `) as unknown as TypedDocumentString<LoadGroupsQuery, LoadGroupsQueryVariables>;
export const LoadLocationDocument = new TypedDocumentString(`
    query LoadLocation($query: String!) {
  locations(query: $query) {
    content {
      id
      code
      name
      type
      isPickup
      isEnabledForPickupAnywhere
      localId
      longitude
      latitude
      agency {
        id
        code
        name
        authProfile
        longitude
        latitude
      }
      parentLocation {
        id
        code
        name
        type
        isPickup
        isEnabledForPickupAnywhere
        longitude
        latitude
        dateCreated
        dateUpdated
        hostSystem {
          id
          code
          name
          lmsClientClass
          clientConfig
        }
      }
      hostSystem {
        id
        code
        name
        lmsClientClass
        clientConfig
      }
      printLabel
      deliveryStops
      locationReference
      dateCreated
      dateUpdated
    }
  }
}
    `) as unknown as TypedDocumentString<LoadLocationQuery, LoadLocationQueryVariables>;
export const LoadLocationForPrGridDocument = new TypedDocumentString(`
    query LoadLocationForPRGrid($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  locations(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    content {
      id
      code
      name
    }
    pageable {
      number
      offset
    }
    totalSize
  }
}
    `) as unknown as TypedDocumentString<LoadLocationForPrGridQuery, LoadLocationForPrGridQueryVariables>;
export const LoadLocationsDocument = new TypedDocumentString(`
    query LoadLocations($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  locations(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    totalSize
    content {
      id
      code
      name
      type
      isPickup
      isEnabledForPickupAnywhere
      printLabel
      localId
      deliveryStops
      lastImported
      latitude
      longitude
      agency {
        id
        name
        code
      }
      hostSystem {
        name
      }
    }
    pageable {
      number
      offset
    }
  }
}
    `) as unknown as TypedDocumentString<LoadLocationsQuery, LoadLocationsQueryVariables>;
export const LoadMappingsDocument = new TypedDocumentString(`
    query LoadMappings($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  referenceValueMappings(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    totalSize
    content {
      id
      fromCategory
      fromContext
      fromValue
      toCategory
      toContext
      toValue
      reciprocal
      label
      lastImported
      deleted
    }
    pageable {
      number
      offset
    }
  }
}
    `) as unknown as TypedDocumentString<LoadMappingsQuery, LoadMappingsQueryVariables>;
export const LoadNumericRangeMappingsDocument = new TypedDocumentString(`
    query LoadNumericRangeMappings($pageno: Int!, $pagesize: Int!, $order: String!, $orderBy: String!, $query: String!) {
  numericRangeMappings(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    totalSize
    content {
      id
      context
      domain
      lowerBound
      upperBound
      targetContext
      mappedValue
      lastImported
      deleted
    }
    pageable {
      number
      offset
    }
  }
}
    `) as unknown as TypedDocumentString<LoadNumericRangeMappingsQuery, LoadNumericRangeMappingsQueryVariables>;
export const LoadPatronIdentitiesDocument = new TypedDocumentString(`
    query LoadPatronIdentities($order: String!, $orderBy: String!) {
  patronIdentities(order: $order, orderBy: $orderBy) {
    totalSize
    content {
      id
      localId
      homeIdentity
      localBarcode
      localNames
      localPtype
      canonicalPtype
      localHomeLibraryCode
      lastValidated
    }
  }
}
    `) as unknown as TypedDocumentString<LoadPatronIdentitiesQuery, LoadPatronIdentitiesQueryVariables>;
export const LoadPatronRequestDocument = new TypedDocumentString(`
    query LoadPatronRequest($query: String!) {
  patronRequests(query: $query) {
    content {
      id
      dateUpdated
      patronHostlmsCode
      bibClusterId
      pickupLocationCode
      pickupPatronId
      pickupItemId
      pickupItemType
      pickupItemStatus
      pickupRequestId
      pickupRequestStatus
      status
      localRequestId
      localRequestStatus
      localItemId
      localItemStatus
      localItemType
      isExpeditedCheckout
      localBibId
      rawLocalItemStatus
      rawLocalRequestStatus
      description
      nextScheduledPoll
      errorMessage
      previousStatus
      pollCountForCurrentStatus
      currentStatusTimestamp
      nextExpectedStatus
      outOfSequenceFlag
      elapsedTimeInCurrentStatus
      localItemHostlmsCode
      localItemAgencyCode
      isManuallySelectedItem
      resolutionCount
      renewalCount
      renewalStatus
      localRenewalCount
      patron {
        id
      }
      requestingIdentity {
        id
        localId
        homeIdentity
        localBarcode
        localNames
        localPtype
        canonicalPtype
        localHomeLibraryCode
        lastValidated
      }
      audit {
        id
        auditDate
        briefDescription
        fromStatus
        toStatus
        auditData
      }
      clusterRecord {
        id
        title
        selectedBib
        isDeleted
        dateCreated
        dateUpdated
        members {
          id
          dateCreated
          dateUpdated
          title
          author
          placeOfPublication
          publisher
          dateOfPublication
          edition
          isLargePrint
          clusterReason
          typeOfRecord
          canonicalMetadata
          metadataScore
          processVersion
          sourceSystemId
          sourceRecordId
          sourceRecord {
            id
            hostLmsId
            remoteId
            lastFetched
            lastProcessed
            processingState
            processingInformation
            sourceRecordData
          }
        }
      }
      dateCreated
      activeWorkflow
      requesterNote
      suppliers {
        id
        canonicalItemType
        dateCreated
        dateUpdated
        hostLmsCode
        isActive
        localItemId
        localBibId
        localItemBarcode
        localItemLocationCode
        localItemStatus
        localItemType
        localId
        localRenewalCount
        localStatus
        localAgency
        rawLocalItemStatus
        rawLocalStatus
        virtualPatron {
          id
          localId
          homeIdentity
          localBarcode
          localNames
          localPtype
          canonicalPtype
          localHomeLibraryCode
          lastValidated
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<LoadPatronRequestQuery, LoadPatronRequestQueryVariables>;
export const LoadPatronRequestsByIdDocument = new TypedDocumentString(`
    query LoadPatronRequestsById($query: String!) {
  patronRequests(query: $query) {
    content {
      id
      dateUpdated
      patronHostlmsCode
      bibClusterId
      status
      localRequestId
      localRequestStatus
      localItemId
      localItemStatus
      localItemType
      localBibId
      rawLocalItemStatus
      rawLocalRequestStatus
      description
      nextScheduledPoll
      errorMessage
      previousStatus
      pollCountForCurrentStatus
      currentStatusTimestamp
      nextExpectedStatus
      outOfSequenceFlag
      elapsedTimeInCurrentStatus
      localItemHostlmsCode
      localItemAgencyCode
      isManuallySelectedItem
      resolutionCount
      renewalCount
      renewalStatus
      localRenewalCount
      dateCreated
      activeWorkflow
      requesterNote
    }
  }
}
    `) as unknown as TypedDocumentString<LoadPatronRequestsByIdQuery, LoadPatronRequestsByIdQueryVariables>;
export const LoadPatronRequestStatsDocument = new TypedDocumentString(`
    query LoadPatronRequestStats($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  patronRequests(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    content {
      id
      dateCreated
      dateUpdated
      patronHostlmsCode
      suppliers {
        localAgency
        canonicalItemType
      }
    }
    pageable {
      number
      offset
    }
    totalSize
  }
}
    `) as unknown as TypedDocumentString<LoadPatronRequestStatsQuery, LoadPatronRequestStatsQueryVariables>;
export const LoadPatronRequestTotalsDocument = new TypedDocumentString(`
    query LoadPatronRequestTotals($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  patronRequests(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    content {
      id
      dateCreated
      dateUpdated
      status
      patronHostlmsCode
      isExpeditedCheckout
      outOfSequenceFlag
    }
    pageable {
      number
      offset
    }
    totalSize
  }
}
    `) as unknown as TypedDocumentString<LoadPatronRequestTotalsQuery, LoadPatronRequestTotalsQueryVariables>;
export const LoadPatronRequestsDocument = new TypedDocumentString(`
    query LoadPatronRequests($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  patronRequests(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    content {
      id
      dateCreated
      dateUpdated
      patronHostlmsCode
      pickupLocationCode
      description
      status
      previousStatus
      nextExpectedStatus
      errorMessage
      nextScheduledPoll
      outOfSequenceFlag
      elapsedTimeInCurrentStatus
      pollCountForCurrentStatus
      isManuallySelectedItem
      requesterNote
      activeWorkflow
      rawLocalRequestStatus
      rawLocalItemStatus
      localRequestId
      localRequestStatus
      localItemId
      localItemStatus
      localItemType
      patron {
        id
      }
      requestingIdentity {
        id
        localId
        localBarcode
        canonicalPtype
      }
      suppliers {
        localAgency
        canonicalItemType
        localItemBarcode
      }
      clusterRecord {
        id
        title
        members {
          publisher
        }
      }
    }
    pageable {
      number
      offset
    }
    totalSize
  }
}
    `) as unknown as TypedDocumentString<LoadPatronRequestsQuery, LoadPatronRequestsQueryVariables>;
export const LoadPatronRequestsForExportDocument = new TypedDocumentString(`
    query LoadPatronRequestsForExport($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  patronRequests(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    content {
      id
      dateCreated
      dateUpdated
      patronHostlmsCode
      pickupLocationCode
      description
      status
      previousStatus
      nextExpectedStatus
      errorMessage
      outOfSequenceFlag
      elapsedTimeInCurrentStatus
      pollCountForCurrentStatus
      isManuallySelectedItem
      requesterNote
      activeWorkflow
      pickupRequestId
      pickupRequestStatus
      pickupItemId
      isExpeditedCheckout
      rawLocalRequestStatus
      rawLocalItemStatus
      localRequestId
      localRequestStatus
      localItemId
      localItemStatus
      localItemType
      patron {
        id
      }
      requestingIdentity {
        localBarcode
        canonicalPtype
      }
      suppliers {
        localAgency
        canonicalItemType
        localItemBarcode
        localItemType
      }
      clusterRecord {
        title
      }
    }
    pageable {
      number
      offset
    }
    totalSize
  }
}
    `) as unknown as TypedDocumentString<LoadPatronRequestsForExportQuery, LoadPatronRequestsForExportQueryVariables>;
export const LoadRolesDocument = new TypedDocumentString(`
    query LoadRoles($order: String!, $orderBy: String!, $pagesize: Int!) {
  roles(order: $order, orderBy: $orderBy, pagesize: $pagesize) {
    totalSize
    content {
      id
      name
      keycloakRole
      description
      displayName
    }
  }
}
    `) as unknown as TypedDocumentString<LoadRolesQuery, LoadRolesQueryVariables>;
export const LoadSupplierRequestsDocument = new TypedDocumentString(`
    query LoadSupplierRequests($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
  supplierRequests(
    pageno: $pageno
    pagesize: $pagesize
    order: $order
    query: $query
    orderBy: $orderBy
  ) {
    content {
      id
      canonicalItemType
      dateCreated
      dateUpdated
      hostLmsCode
      isActive
      localItemId
      localBibId
      localItemBarcode
      localItemLocationCode
      localItemStatus
      localItemType
      localId
      localStatus
      localAgency
      rawLocalItemStatus
      rawLocalStatus
      localRenewalCount
      virtualPatron {
        id
        localId
        homeIdentity
        localBarcode
        localNames
        localPtype
        canonicalPtype
        localHomeLibraryCode
        lastValidated
      }
      patronRequest {
        id
      }
    }
    pageable {
      number
      offset
    }
    totalSize
  }
}
    `) as unknown as TypedDocumentString<LoadSupplierRequestsQuery, LoadSupplierRequestsQueryVariables>;