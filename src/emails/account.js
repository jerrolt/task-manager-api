const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (to, name) => {
    sgMail.send({
        to,
        from: 'gene0904@gmail.com',
        subject: 'Welcome to Task Manager',
        text: `Hi ${name}, You have successfully registered for a task manager account.  Enjoy!!`
        
        //html: ``
    })
}

const sendCancelEmail = (to, name) => {
    sgMail.send({
        to,
        from: 'gene0904@gmail.com',
        subject: 'Cancelation Notice',
        text: `${name}, I noticed you recently cancelled your account.  Please let us know why.  Thanks.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}