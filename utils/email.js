const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `WebsWonder <${process.env.EMAIL_FROM}>`;
  }

  //*1)Create a transporter
  newTransport() {
    //*We are setting 'OUR' senders email to send email to client.
    if (process.env.NODE_ENV === 'production') {
      //^nodemailer: It allows you to send emails from your server with ease.
      //If In production we are sending mails from real email service.
      return nodemailer.createTransport({
        //^Sendinblue its a mailing service for marketing. Gmail Alternative.
        service: 'SendinBlue',
        auth: {
          user: process.env.SENDINBLUE_USERNAME,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });
    }

    //If In development we are fake sending email's from "Mailtrap" which fakes the email send process.
    //means it does not go to real address but traps email within itself for testing usecase.
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      //Activiate in gmail "less secure app" option
      //^NOTE: never user gmail for production 1. limits to 500 email/day only. 2.will mark as spammer.
      //^ & alternatives are sendgrid , mailgun.
    });
  }

  //*Send actual Email
  async send(template, subject) {
    //1) Render HTML based on a pug template.
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    //2) Define Email Options.
    const mailOptions = {
      //from does not matter for as we are just testing.
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    //3 Create a Transport and send Email.
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours Family!');
  }

  async sendPasswordRest() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
