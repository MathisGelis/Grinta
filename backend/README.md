<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests: the whole API on a disposable Postgres database, whose name
# must contain "e2e" or "test" (the tests refuse to run otherwise).
# Migrations run at startup.
$ createdb grinta_e2e
$ DB_HOST=localhost DB_NAME=grinta_e2e DB_SSL=false npm run test:e2e

# test coverage
$ npm run test:cov
```

## Validation errors

A body or query that fails validation gets a `400` with a stable code per error, for the app to translate:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Adresse e-mail invalide.",
  "errors": [
    { "field": "email", "code": "EMAIL_INVALID", "message": "Adresse e-mail invalide." },
    { "field": "exercises.0.sets.1.weight", "code": "VALUE_TOO_LARGE", "message": "« exercises.0.sets.1.weight » doit être inférieur ou égal à 1000." }
  ]
}
```

`message` is the first error's message, in French. `field` is the path in the body or the query string.

| Code | Meaning |
| --- | --- |
| `FIELD_REQUIRED` | Missing or empty value |
| `FIELD_NOT_ALLOWED` | Unknown field, not accepted by the route |
| `FIELD_TOO_SHORT` | Text shorter than allowed |
| `FIELD_TOO_LONG` | Text longer than allowed (e.g. a comment over 500 characters) |
| `EMAIL_INVALID` | Not an email address |
| `PASSWORD_TOO_SHORT` | Password under 8 characters (`password`, `newPassword`, `currentPassword`) |
| `PASSWORD_TOO_LONG` | Password over 72 characters |
| `USERNAME_INVALID` | Username not 3 to 30 characters among `a-z 0-9 _ .`, or a dot at either end |
| `STRING_EXPECTED` | Text expected |
| `NUMBER_INVALID` | Number expected, 2 decimals at most |
| `INTEGER_EXPECTED` | Whole number expected |
| `BOOLEAN_EXPECTED` | `true` or `false` expected |
| `VALUE_TOO_SMALL` | Number under the minimum |
| `VALUE_TOO_LARGE` | Number over the maximum |
| `VALUE_NOT_ALLOWED` | Not one of the accepted values (enum) |
| `DATE_INVALID` | Not a valid date |
| `ID_INVALID` | Not a valid identifier (uuid) |
| `FORMAT_INVALID` | Does not match the expected format |
| `ARRAY_EXPECTED` | List expected |
| `ARRAY_TOO_SHORT` | List with too few items |
| `ARRAY_TOO_LONG` | List with too many items |
| `INVALID` | Any other rule |

Other errors (`401`, `403`, `404`, `409`, `429`, ...) keep the format `{ statusCode, message: { message, ... } }`.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
