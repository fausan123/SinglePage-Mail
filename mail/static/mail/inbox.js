document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');


});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-emails').style.display = 'none';
  document.querySelector('#message').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  //send mail
  document.querySelector('#compose-form').onsubmit = send_mail;


}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-emails').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET request to get emails
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Print emails
      console.log(emails);
      emails.forEach(email => {
        const element = document.createElement('div');
        element.classList.add('rounded-pill');

        var sender;
        if (mailbox == 'sent') {
          if (email.recipients.length == 1) {
            sender = `To: ${email.recipients}`;
          }
          else {
            sender = `To: ${email.recipients[0]} and ${email.recipients.length - 1} more`
          }
        } else {
          sender = email.sender;
        }

        var subject;
        if (email.subject.split("").length > 150) {
          subject = `${email.subject.slice(0, 150)}......`;
        } else {
          subject = email.subject;
        }

        element.innerHTML = `<div class="border rounded-pill p-2 mt-2 mail" id="${email.id}"><strong>
        ${sender}</strong> &nbsp &nbsp<span>${subject}</span>  <span class="text-muted float-right">${email.timestamp}</span></div>`
        if (email.read) {
          element.style.background = '#ececec';
        } else {
          element.style.background = '#ffffff';
        }
        document.querySelector('#emails-view').append(element);
        element.addEventListener('click', () => {
          view_mail(email.id, mailbox);
        })
      })
    })
    .catch(error => {
      console.log(`Error - ${error}`);
    });

}

function send_mail() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
      const msg = document.querySelector('#message');
      if (result.status == 201) {
        load_mailbox('sent');
      } else {
        msg.style.display = 'block';
        msg.innerHTML = `<div class="alert alert-danger">${result.error}</div>`
        window.scrollBy(0, -window.scrollY)
      };
    });
  return false;
}

function view_mail(id, mailbox) {

  // Show the mail and hide other views
  document.querySelector('#read-emails').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // GET request for each email
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {

      console.log(email);
      const div = document.querySelector('#read-emails');

      div.innerHTML = `<button class="btn btn-primary float-right ml-1" id="reply">Reply</button>`;

      if (mailbox == 'inbox') {
        div.innerHTML += `<button class="btn btn-primary float-right arc" id="archive">Archive</button>`;
      } else if (mailbox == 'archive') {
        div.innerHTML += `<button class="btn btn-danger float-right arc" id="unarchive">Unarchive</button>`;
      }

      const recipients = email.recipients.join(', ');

      div.innerHTML += `<h2>${email.subject}</h2><p class="text-muted small second-box">${email.timestamp}</p><hr>
      <div><p class="second-box"><strong>From:</strong> ${email.sender}</p><p class="second-box"><strong>To:</strong> ${recipients}</p>
      </div><hr><pre>${email.body}</pre>`

      // Archive or Unarchive email
      if (mailbox == 'inbox' || mailbox == 'archive') {
        const archive_btn = document.querySelector('.arc')
        archive_btn.addEventListener('click', () => {

          archive_mail(id, archive_btn.id);
          load_mailbox('inbox')

        })
      }

      // Reply to mail
      const reply_btn = document.querySelector('#reply');
      reply_btn.addEventListener('click', () => {

        compose_reply(email);

      })

    })
    .catch(error => {
      console.log(`Error - ${error}`);
    })


  // PUT request to mark email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })


}

// Function to archive or unarchive mail
function archive_mail(id, status) {

  var archived;
  if (status == 'archive') {
    archived = true;
  } else {
    archived = false;
  }

  // PUT request to archive email
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archived
    })
  })

  return false;
}

// Reply compose function
function compose_reply(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#read-emails').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-header').innerHTML = 'Reply';

  var subject;
  if (email.subject.slice(0, 4) == 'Re: ') {
    console.log('done');
    subject = `${email.subject}`;
  } else {
    console.log('not done');
    subject = `Re: ${email.subject}`;
  }

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`;

  //send mail
  document.querySelector('#compose-form').onsubmit = send_mail;


}