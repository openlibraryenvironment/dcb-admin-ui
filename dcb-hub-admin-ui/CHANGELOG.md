# [1.18.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.17.1...v1.18.0) (2024-06-26)


### Features

* Add manually item selection flag to request grids [DCB-1271] ([e644309](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e6443091d5f236980f88d01caffcd5e95bdfe40c))
* Present raw item and request status on patron request details page [DCB-1142] ([7706ed8](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/7706ed81b6bbc7aa8e0e4caf3124f71326175c07))
* Show whether item is manually selected in request details [DCB-1271] ([58adc81](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/58adc810e3b47276d18156e760c61ec3de89c2f0))

## [1.17.1](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.17.0...v1.17.1) (2024-06-24)


### Bug Fixes

* patron request quick filters ([5269240](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/52692404eca0e2535e08017a450d9cd66a37c2d8))
* Standardise patron request grid presentation across DCB Admin [DCB-1231] ([5fdff82](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/5fdff82d364cbbd8a5cf1866f020e85988a618aa))

# [1.17.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.16.1...v1.17.0) (2024-06-19)


### Bug Fixes

* Additional logging for refresh token method [DCB-1214] ([af4e415](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/af4e415bb9c2e777164b4f9873fcc4ebda809630))
* Adjust handling of first sign-in and add logging [DCB-1214] ([e34a02b](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e34a02b7d4ad72d4dabc1688fddbedcd533c297a))
* Adjust refetch interval ([3445c68](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/3445c68e14f92141873f522c4410681bd0101f71))
* Adjust untracked statuses [DCB-1091] ([efe90de](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/efe90de84df551225c73ba811d84fd10989eedc2))
* Fix accessibility issue with sidebar focus [DCB-1234] ([5af48df](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/5af48df7c22c45d35295c2b9e319371e6f80ba8e))
* Improve sidebar performance [DCB-261] ([ecd6961](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/ecd6961a695f7e15d73323e602abe61c1ecb45ee))
* Remove inoperational filters [DCB-1132] ([9be1996](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/9be19965d5959aec89c73fbcecae8b2d4272b6d3))


### Features

* Disable patron request force update in certain states [DCB-1091] ([b7b7782](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/b7b7782590b48febab3637320d72e242ed1c19e6))
* Display categorised patron requests [DCB-1231] ([45f0cde](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/45f0cdea8e9dfe31c1d15ac2c8190ddbaf7f9218))

## [1.16.1](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.16.0...v1.16.1) (2024-06-13)


### Bug Fixes

* Adjust refresh access token error handling [DCB-1154] ([4a687a9](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/4a687a9ce7952ff6b872c04727982450ec4e724d))
* Prevent flickering on home page [DCB-1205] ([23a0cae](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/23a0cae303669764e398d14559ab2ae160a16fd1))
* Restore behaviour of return to patron request button [DCB-1206] ([bfd0d01](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/bfd0d01d8eb51ed672975cd500926b7eb8692cde))

# [1.16.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.15.0...v1.16.0) (2024-06-11)


### Bug Fixes

* Adjust next-auth behaviours [DCB-1154] ([60f1042](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/60f1042eb384b0486a5ca468304e9ae073ca3dd0))


### Features

* Update DCB Admin for service launch [DCB-1198] [DCB-1197] ([b8ef295](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/b8ef2957de7db923a57353178dcd71290fe4445a))

# [1.15.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.14.0...v1.15.0) (2024-06-07)


### Bug Fixes

* Add RetryLink to ApolloClient [DCB-1154] ([fd7f10b](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/fd7f10b660da8a34d2ce9e33ab030def475de37b))
* Restore roles to profile page on dev ([38504ae](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/38504aede6ad7c02a3bf63429535cdc12548df90))


### Features

* Add library-specific mappings to details page [DCB-1179] ([85aa517](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/85aa517ee6a5698253031429bc88cb0faf7acdc0))
* Introduce ErrorLink to Apollo Client implementation [DCB-1154] ([b3f845f](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/b3f845f3f24778f37d218b1c85a36c188e6ac059))
* Restrict mappings operations to authorised users [DCB-606] ([1d321dd](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/1d321dd54d2cb048592621e45c866433154e984c))

# [1.14.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.13.0...v1.14.0) (2024-06-05)


### Bug Fixes

* Fix typo in mapping comparison [DCB-1188] ([1103360](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/1103360bcf10da4f51098370d38dd36436921cd7))
* Prevent auto-triggering of upload error [DCB-1188] ([3913072](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/391307219c7bed389cd3924b74f4c0557d5febba))


### Features

* Extend import to all reference value mappings [DCB-1152] ([5758d29](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/5758d295a8e9b82b6bc3d1538832039ca243bd3f))

# [1.13.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.12.0...v1.13.0) (2024-05-24)


### Bug Fixes

* Add 'not set' to library participation text [DCB-1129] ([f37eb52](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/f37eb529013adca5df34a5225bf16af7cf3b776a))
* Adjust positioning of numbers in accordion titles [DCB-1128] ([50f15a7](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/50f15a754e43c818418b14804acccc264c631510))
* Adjust titles on service status page [DCB-1151] ([5aef848](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/5aef8488767ccbe6c8154d4686a04a06d468881f))
* Fix initial request failures [DCB-1149] ([a5a3dc1](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/a5a3dc146c96887c065b3a197e466f7303045ac6))
* Introduce a refresh token buffer [DCB-1149] ([e5b2241](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e5b2241980f66643a86c6676f1764d4fd69dcde1))
* request grid filters and out of sequence description on library page [DCB-1128] ([2007a3f](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/2007a3f2388755287534ac60529a22e90e863a28))


### Features

* Add service status page [DCB-1151] ([75bf507](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/75bf5079e1ab01bc4d085e056748d0645fa7c367))
* Manage library participation through DCB Admin [DCB-1129] ([c9b54ac](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/c9b54ace2bcb63c5c32bfe4f3833a28a33f44686))

# [1.12.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.11.0...v1.12.0) (2024-05-20)


### Features

* Add number of requests to library details accordions [DCB-1128] ([06711b4](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/06711b43306e7b5829f00087d99483aa22b3692c))
* Add patron request grids to library details page [DCB-1128] ([993a753](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/993a753f5f74a24aa51209f3dcc414b14d055b5f))

# [1.11.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.10.1...v1.11.0) (2024-05-15)


### Bug Fixes

* Adjust operational page behaviour [DCB-1103] ([3751281](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/3751281c849f7a551d552f8e7605770876873a7d))
* Clarify operational toggle wording  [DCB-1103] ([e5fde4b](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e5fde4b9a5538e1865d0636b128c24b27fef78c2))
* Fix libraries quick search and code filter ([27d5ba8](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/27d5ba8d9d93ceecf13c4fbf955f83ac11a03528))
* Remove location link on library detais page ([131e3d0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/131e3d05cb309dd0d19745d47f15a61de7db44b8))


### Features

* Add HostLMS suppression rulesets [DCB-1097] ([4f21b2a](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/4f21b2aa37b17cc5070c6854d62e8efbd10236a8))
* Add operating welcome page [DCB-1103] ([226cb2e](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/226cb2ecda51787d7d8a50f86fe4d50af8a120b0))
* Enable multi-filters in DCB Admin [DCB-1100] ([6cedba3](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/6cedba38168025f0cd03fa23549091368567fa1a))

## [1.10.1](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.10.0...v1.10.1) (2024-05-03)


### Bug Fixes

* Add optional title prop to RenderAttribute ([9b78747](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/9b7874729407d2ed37e2f9cd10b165aebb75a860))
* Improve diagnostic fields view in request grid [DCB-1081] ([0759620](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/07596202b7bc9fed6dff95e55f898c87a308b05d))
* Reorganise hostlms grid and details pages DCB-1092 ([5062e40](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/5062e4024db7e9e8875c80d230ad8640b3559e06))

# [1.10.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.9.0...v1.10.0) (2024-04-26)


### Bug Fixes

* Add formatDuration helper function [DCB-1064] ([2dc1d84](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/2dc1d84b1765441ac25cb19be15bbb493b60bdae))
* Change session maxAge [DCB-996] ([c4eae64](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/c4eae64902c86c9ebbd1df6a027a652a3da89000))
* Change session refetching interval [DCB-996] ([b66cdd6](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/b66cdd630b7760463fb64761530cdbb85c3f3519))
* Fix consortium name not always displaying properly ([3efba52](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/3efba5223e25da2ec41b71f741bc92106a9de1ed))
* Fix libraries sort indicator ([5119d3e](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/5119d3e9f8a00c32c303b48bbb28112e7f723c9c))
* Make ingest column reflect ingest values ([84bd31e](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/84bd31eb6ebc1312e0c49dafbcb0a42dcf51bc11))
* More changes to session handling [DCB-996] ([c6803cc](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/c6803cc8b06e080ff2aa77be8bf0d31d517f0206))


### Features

* Add numeric range mappings grid [DCB-1065] ([9466f28](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/9466f286b7268d2ddb0b8bf303ac0cf4ba2889f0))
* Add request telemetry to grid [DCB-1064] ([1807b2e](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/1807b2e457acf8610d17183618da2550e59b37cc))
* Add request transition telemetry to patron request details page [DCB-1045] ([8a8bb83](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/8a8bb834e3500b9ae00a9b71546380215e5707a0))
* Use names for adding library to group [DCB-1042] ([d0fec32](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/d0fec324044fdfd4d278e1efc21e5e49f0485732))

# [1.9.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.8.1...v1.9.0) (2024-04-22)


### Bug Fixes

* Long titles overlap content [DCB-862] ([5af1a2c](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/5af1a2ce84709ba7db20b887a01d490270364cbd))


### Features

* Add loading and error components [DCB-885] ([bc2b07b](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/bc2b07b0f0cd8b1b82f0f3d22cebb1d5df8d29f0))
* Introduce libraries and library groups to DCB Admin [DCB-914] ([78834d3](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/78834d31b08a006f1efbbd23c7c9a163fe2e99da))

## [1.8.1](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.8.0...v1.8.1) (2024-04-10)


### Bug Fixes

* Anchor at audit log when returning to patron request [DCB-1001] ([40961c7](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/40961c707ba78e20789c87aef939ce07d5552f53))
* asjust styling to centre content ([87a4c74](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/87a4c746f031552354aeb250702371ecc4c5d566))

# [1.8.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.7.0...v1.8.0) (2024-04-04)


### Bug Fixes

* Ensure ingest displays correctly on details page ([2be8ae5](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/2be8ae5d45e4766be5dcb60d5a54bec09b549d33))
* Fix issue with ts-ignore in nextauth.ts ([0c44087](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/0c4408725fc5d45af8ecb3e9c6989637719958cf))
* Improve accessibility of blank fields [DCB-932] ([2142545](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/21425451934ac355930f19debaaa7cca0f5b3f82))
* Replace fallback text with translation key [DCB-936] ([440bc8b](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/440bc8b3efc1d586df918cae966f3abce98110b3))


### Features

* Add 'update now' button to PR details [DCB-989] ([e8ac945](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e8ac9458acfe9b88918b52d859bb79ebf61fe069))
* Add nextScheduledPoll to details page [DCB-989] ([684e42c](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/684e42cfb214c71f76c6974497f60d577f336e62))

# [1.7.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.6.0...v1.7.0) (2024-03-19)

### Bug Fixes

- Add 'no source records' message to patron request details ([e037ecc](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e037ecca4c02a337df31c42c4d37d616d9b4b793))
- Add aria-label to breadcrumbs [DCB-878] ([e4ad7b3](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e4ad7b35ff3beeee4eaaaf085ca9964b8fd66185))
- Correct labelling of supplying agency code ([2772178](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/2772178af6ab90ee43313b8cd1cb95a50b8fcf3b))
- Display all source records on patron request details page ([0bbdc5e](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/0bbdc5e6587fc0a45a5aabebb49c626014280d26))
- Fix Cypress login test failures [DCB-930] ([5276701](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/52767017a03d719a349d16f8056aedbb2391b372))
- Improve accessibility of sensitive data toggle [DCB-887] ([8326423](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/83264235393af87f4278983edd59eb31d389e0b9))
- Scrollbar appearing in a HostLms details page [DCB-913] ([2cfacbe](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/2cfacbef1e843125c4752b9f5e6898e453cd39ba))

### Features

- Add bib record hostlms count page [DCB-912] ([790da9f](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/790da9fc5a4dfd44e8c09974de6ca844d2a379b9))
- Create new footer and edit the existing footer [DCB-881] ([8d61dc5](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/8d61dc578a4711fae6361061ce6333387755c4e3))
- Improve patron request grid and details audit log default info DCB-916 ([1df2d67](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/1df2d679a24e0511bb7118f74fe7de83d2849363))
- Link bib cluster ID to discovery scaffold record [DCB-908] ([5354a45](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/5354a455c488fc2deb795d17f9c9c52090ddddd9))
- Present human-readable breadcrumbs [DCB-878] ([376ad9b](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/376ad9bc9604d7752f5cd5397313199ca7bcac1b))

# [1.6.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.5.0...v1.6.0) (2024-03-04)

### Bug Fixes

- Add support ticket link [DCB-821] ([03d78d5](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/03d78d5688c2c274f2849372197747e9efc09ce9))
- Additional logging to catch the Vercel timeout issue ([2753cbb](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/2753cbbfab1b980679c33af7a71f7014bb1c835e))
- fix 'hidden element must not be focusable' ([82b3d01](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/82b3d0110c0100dd6d2dc77fcb4f6c4930b17f5b))
- Remove serverless functions from DCB Admin [DCB-906] ([76b6e96](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/76b6e962796a711ed982e8c34ac7da6371553e5a))
- Sort audit logs to show newest first [DCB-905] ([9145cc7](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/9145cc79e3474f3929f6f4978ce83eb6c7d5f205))

### Features

- Add landing page for DCB Admin [DCB-821] ([3af08cc](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/3af08ccdeeee75a9670a8c83070434f01aa10016))
- Set up base theme with existing styles [DCB-874] ([c29da14](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/c29da1430254d36a2c0ec5dd6b1ff7b9871ecc7d))

# [1.5.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.4.0...v1.5.0) (2024-02-21)

### Bug Fixes

- Add temporary logging for sporadic 504 failures [DCB-868] ([cca0378](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/cca037889a4ad5ebec3e98dd25159ad92eef981a))
- Fix floating button on audit page [DCB-865] ([f7ab889](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/f7ab889437005113a6756b43fbbf6dbfbf42e4ce))
- Fix incorrect metadata translation key on HostLMS details page ([1866664](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/1866664193e8d294323da5580b48671d9ed3c522))
- Fix incorrect status text on audit details ([2bf3ae2](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/2bf3ae26ab463ead67f62dbacd67010b3ea7068d))
- Fix incorrect text in PatronRequest details ([aa99927](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/aa999270f4c93727f74c0aad839bfad8b25ef836))
- Group data grid has lost its "empty" message [DCB-846] ([17b2a11](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/17b2a114e3ed430374797a72e6d2e8396c533b7f))
- Remove “aria-current="page"“ from the sub-page menu options [DCB-835] ([ba7e241](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/ba7e2418e38c90b0d7a36f195f0a1b6074160801))
- Remove unecessary breadcrumbs translation key [DCB-866] ([c0074fe](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/c0074fe6131f060463470190ab1fdcfddce987c5))
- Support hierarchical keys for navigation [DCB-866] ([ce342ad](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/ce342ad6c1f39d3dced13001b60eabcbc66f4812))

### Features

- Obscure private Host LMS data [DCB-859] ([e0d4704](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e0d47047cf40dee0090cd94f22ec462cb5e20a66))

# [1.4.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.3.1...v1.4.0) (2024-02-08)

### Bug Fixes

- Adjust margins and breadcrumb wrapping [DCB-466] ([89ffe5c](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/89ffe5c02feadaebd54e1eaa9ed7ff8853d2c584))
- Adjust padding for admin layout [DCB-466] ([5960301](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/596030184b891ca5dd57969bcfa68afd62093080))
- Clean up query and details fields [DCB-856] ([909336d](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/909336d7477a131a679b43215fb729ec28561bb6))
- Fixed incorrect filtering behaviours and updated tests [DCB-480] ([e333cf5](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e333cf586cb78b584f615e5a61393ff50bc1826c))
- handle unexpected data ([01e05c6](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/01e05c6f3e2b6307d0b2082f24be59774123fb28))
- Update breadcrumbs to use translation keys [DCB-818] ([50c7ecf](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/50c7ecf5f49f1e2c12316ef755f391982f58ec8d))

### Features

- Indicate the current section in the sidebar menu [DCB-835] ([ae15cd6](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/ae15cd6f83daf17aba0c009dffe755807842026c))
- Transition to new base theme [DCB-836] ([080f7e7](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/080f7e7359cfc36414ab6f20d85dd4ff6a7dc8d1))

## [1.3.1](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.3.0...v1.3.1) (2024-01-17)

### Bug Fixes

- Remove outline on sourceBibs page [DCB-817] ([1cfaca3](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/1cfaca35f36270381ff2a206a11a40fe44af0859))

# [1.3.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.2.1...v1.3.0) (2024-01-04)

### Features

- Bump commit to attempt to trigger release ([4ad33a5](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/4ad33a559e6584b24971bdec4250c612afc1ec9e))

## [1.2.1](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.2.0...v1.2.1) (2023-12-21)

### Bug Fixes

- bump commit to trigger a new minor version ([78deddf](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/78deddf27b06642b78815775428fa86657746a3b))

# [1.2.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.1.0...v1.2.0) (2023-12-20)

### Bug Fixes

- Better handling of missing canonicalMetadata ([df82901](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/df829011f49a66a243a7bf116116fe18132bbda2))
- Calculate DCB health status for any services [DCB-793] ([d35757d](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/d35757dfb35e7c10291a6fd4c304ec4c3b78157a))
- correct translation keys ([b8b2749](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/b8b274949d35886272b0f71f50a6a5314b09ec5a))
- Hide unsupported filters [DCB-526] ([b9de914](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/b9de914a933bfd7c647065a701e36633f7993e8f))
- Trans issue with keys and restructure [DCB-759] ([5aabe6b](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/5aabe6b99a0898b657856d3e2776b3ee02a59515))
- Update PatronRequest query ([8cf74e9](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/8cf74e9b4d9766eddbb2a63a0f2c2d866eb16a93))
- use plural keys [DCB-759] ([72ab0e3](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/72ab0e39725dad0e07a4fab48c5f14d13dc9287a))

### Features

- use of Trans component adjust ([4108d7d](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/4108d7ddf25bb32e8e8d827bd77415657248840b))

# [1.1.0](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/compare/v1.0.4...v1.1.0) (2023-12-12)

### Bug Fixes

- Add virtual items to Borrowing section [DCB-752] ([53646cb](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/53646cb751b8c027e3e1592417b7c2ffe7960b59))
- Display upload error when no Host LMS provided [DCB-487] ([e017f21](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/e017f21b36fc873fe9d3d4c9f87e29c2c110052d))
- Move BibRecord section on Details page for QA [DCB-748] ([3245aa5](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/3245aa5dac2330fe9dd9bfc09c6d2e88206ad196))
- Rename borrowing request attributes [DCB-752] ([1077948](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/1077948b4596b0c1b2e5ab9a004a946f186ab59d))

### Features

- **i18n:** Define application onboarding keys ([262147e](https://gitlab.com/knowledge-integration/libraries/dcb-admin-ui/commit/262147e63db4ecc0d31a35f7528ddbf74dd2b8ca))

## [1.0.4](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/compare/v1.0.3...v1.0.4) (2023-11-29)

### Bug Fixes

- Set request details page to expand all by default [DCB-744] ([fbc58cf](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/fbc58cf46d8e0392dfba84ba7d706441bd13ca69))
- Standardise timestamp formatting [DCB-744] ([6da7ec6](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/6da7ec65053f414f1c1a61fc7ced2a4167e288b8))

## [1.0.3](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/compare/v1.0.2...v1.0.3) (2023-11-01)

### Bug Fixes

- Add upload error handler [DCB-487] ([3c554ce](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/3c554ce65099c92bd7742b5ed476dfe5aeb4d594))
- Remove unnecessary React imports [DCB-524] ([12b5416](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/12b5416b31cdec557dde844a964a4b97de1e777c))

## [1.0.2](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/compare/v1.0.1...v1.0.2) (2023-10-25)

### Bug Fixes

- Fix i18n key error message [DCB-507] ([13bfbbc](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/13bfbbc98121d4a35812b60470c2634d1b3e48fa))

## [1.0.1](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/compare/v1.0.0...v1.0.1) (2023-10-18)

### Bug Fixes

- Fix access token issues [DCB-488] ([724ad34](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/724ad34c18a4a0400ff422e5ebfd3c6c11f924ce))

# 1.0.0 (2023-10-11)

### Bug Fixes

- **build:** Add missing script tag to new build stage ([6821de7](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/6821de768fc0bd774e52449f627b715a4ca87f87))
- **build:** Corrected cache path for node_modules ([2fce1c7](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/2fce1c7c979578981a0684a67e596b9251c0d63e))
- **build:** Files key is not a valid cache directive any longer ([fdb16ab](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/fdb16ab0b61e234f2ff7a0106a1ade805810049d))
- Capitalise alert titles and expand logging ([92b6474](https://gitlab.com/knowledge-integration/libraries/dcb-hub-admin-scaffold/commit/92b6474d5fbbfd446c6582172c7125cc75d64428))
