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



