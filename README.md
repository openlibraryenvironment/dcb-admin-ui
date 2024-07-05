# dcb-admin-ui


## Welcome

Welcome to DCB Admin! DCB Admin is a Knowledge Integration application and is part of the wider Direct Consortial Borrowing project. It is designed to help people administrate instances of DCB.

You can find the DCB Service repository [here](https://gitlab.com/knowledge-integration/libraries/dcb-service) and more information [here](https://openlibraryfoundation.atlassian.net/l/cp/67Q16M0Q). 

DCB Admin is written in TypeScript using Next.js 13.5.2 and React 18. [Material UI](https://mui.com/) v5 has also been used within the project to deliver a dynamic, themable and resillient modern user interface.

This project conforms to the [WCAG 2.1](https://www.w3.org/TR/WCAG21/) accessibilty guidelines. If you would like to experience DCB Admin in dark mode, please set your system settings accordingly.

## How to get started

To get started with this project, simply clone it into your IDE of choice. You will need to _npm install_ the project's dependencies, and for development you will also need a .env file - speak to your team about this.

To see the application running, please visit https://admin.dcbdev.lsphost.com/ - this is based upon the _main_ branch. https://admin.dcbqa.lsphost.com/ currently plays host to our release branch deployment, which is typically behind main.

## Documentation

See [developer guidance](https://openlibraryfoundation.atlassian.net/wiki/label/DCB/dcb-admin) for DCB Admin documentation.

## Testing

[DCB Admin uses Cypress](https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2763128849/) for end-to-end automated tests. 

Please refer to the [DCB Admin documentation](https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2763128849#Configuration-/-setup-within-DCB-Admin) for guidance on getting started.

## Contributing

Contributors should be aware of the following standards for code formatting and linting in DCB Admin. These are intended to ensure code is properly formatted and common mistakes are avoided before committing to the repository.

If this is your first commit after these changes were made, please run `npm install` before you commit.

### Standards

Contributions to DCB Admin must meet the following standards, most of which have been taken from our DCB Definition of Done:

- The code for the issue must be written with accompanying tests (where required), and should have passed manual developer testing. 
- All defined acceptance criteria must have been met, as well as any other criteria (i.e. accessibility).
- Commit messages should be in the conventional format (see the [Angular guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines))
- The AXE Dev Tools must be run against all pages affected by the changes, and any accessibility issues must be fixed before contributions are submitted for review. We follow the WCAG 2.1 accessibility guidelines, which can be found [here](https://www.w3.org/TR/WCAG21/) 
- Any relevant scripts and technical documentation should be updated.
- Tests should be run before submitting an MR, and any failures must be addressed before submitting. If you run into failures that you're not sure about, please submit your MR as a draft so that others can assist you.
- This also applies to the pre-commit hooks. Do not skip these or add 'ignore' statements without clear justification. It is also recommended that you run `npm run build` before submitting your changes, to catch potential build failures.
- A link to a screen capture or a link to a Vercel preview branch should be added to the MR. This aids QA, and makes potential changes more visible.

### Formatting 

DCB Admin uses [Prettier](https://prettier.io/docs) for code formatting. Please install the Prettier extension in your editor and, if using VS Code, set Prettier as your default formatter and enable 'format on save'. If you're having issues, Ctrl-Shift-P, open your user settings, and ensure Prettier is set as `editor.defaultFormatter` and that `editor.formatOnSave` is also enabled.

### Linting 

DCB Admin uses [ESLint](https://eslint.org/) with [TypeScript ESLint](https://typescript-eslint.io/) tooling and the recommended TypeScript ESLint configuration. Our ESLint setup also includes [JSX a11y](https://www.npmjs.com/package/eslint-plugin-jsx-a11y) for accessibilty linting and [eslint-config-next](https://nextjs.org/docs/app/building-your-application/configuring/eslint).

To run ESLint, please run the command `npm run lint `. For automatic linting, please ensure you have the ESLint extension installed in VS Code. You can also configure your settings like so to have ESLint run on save:
```
"editor.codeActionsOnSave": {
		"source.fixAll.eslint": "explicit"
},
```
### Pre-commit checks

DCB Admin uses a pre-commit Git hook, implemented with [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) to run Prettier and ESLint on staged items and catch common issues before they are committed. If issues that can't be automatically fixed are present, the pre-commit hook will point you in the right direction.


## Raising an issue

// TODO


## Roadmap
// TODO 

# Releases

This project is released using semantic_release. See the tags section for past releases.



