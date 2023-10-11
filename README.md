# dcb-admin-ui


## Welcome

Welcome to the DCB Admin UI application! The Admin UI is a Knowledge Integration application and is part of the wider Direct Consortial Borrowing project. It is designed to help people administrate instances of DCB.

You can find the DCB Service repository [here](https://gitlab.com/knowledge-integration/libraries/dcb-service) and more information [https://openlibraryfoundation.atlassian.net/l/cp/67Q16M0Q](url). 

The admin UI is written in TypeScript, and uses Next.js and React. [Material UI](https://mui.com/) has also been used within the project to deliver a dynamic, themable and resillient user interface.

This project also conforms to the [WCAG 2.1](https://www.w3.org/TR/WCAG21/) accessibilty guidelines. If you would like to experience the admin UI in dark mode, please set your system settings accordingly.

## How to get started

To get started with this project, simply clone it into your IDE of choice. You will need to _npm install_ the project's dependencies, and for development you will also need a .env file - speak to your team about this.

To see the application running, please visit https://admin.dcbdev.lsphost.com/ - this is based upon the _main_ branch. https://admin.dcbqa.lsphost.com/ currently plays host to our release branch deployment, which is typically behind main.

## Documentation

To follow.

## Testing

This project will be using Cypress and Jest for testing in future releases. Once this has been implemented, this section will be updated with details of how to run the tests.

Expected process:
_npm run cypress_ for Cypress integration tests (make sure you have Cypress installed - this will launch Cypress so you can choose which tests to run)
_npm run jest_ for Jest unit / snapshot tests - this will typically run all Jest tests, you can specify with --[jest.filename].

# Releases

This project is released using semantic_release. See the tags section for past releases

## Screenshots

A look at the admin UI in its current early stages. UI elements and pages may be subject to change.

![Add-Agencies-Form](https://drive.google.com/uc?id=1VEZogEd_8P5bbvoPFgMdsCgPLxnetGal "Add Agencies Form")
![Groups-Page](https://drive.google.com/uc?id=1fv3JU7uVJytJiRSx7mFN7KKE_wXrohdF "Groups Page")
![HostLMS-Page](https://drive.google.com/uc?id=1URZtchBa0YqdYFjr72weCD5Af0a4ejHN "HostLMS Page")
![Locations-Page](https://drive.google.com/uc?id=1DloMYDfMQQ7aFpCxU0QwbZjQgOKU_GF2 "Locations Page")
![Mappings-Page](https://drive.google.com/file/uc?id=1LzHXskc635TluToeEC22SR1qEQVcXMxd "Mappings Page: WIP")
![New-Group-Form](https://drive.google.com/file/uc?id=1eG2XC2aQzs2F-w1ncCjs6Nbw7eN3Q9aR "New Group Form")
![Requests Page](https://drive.google.com/file/uc?id=1VEZogEd_8P5bbvoPFgMdsCgPLxnetGal "Requests Page")

## Roadmap
// TODO 

