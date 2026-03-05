let flashMessage = null;
document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

//this function compose an email, subsequently sent-mailbox opens up with a success message.
function compose_email(email, isReply) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  if (isReply) {
    document.querySelector('#compose-recipients').value = email.sender;
    let subject = email.subject;
    subject = "Re: " + subject;
    document.querySelector('#compose-subject').value = subject;

    const body = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}\n`;
    document.querySelector('#compose-body').value = body;
  } else {
    // If a user is composing a email of a new subject, clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }

  //   Send Mail: When a user submits the email composition form, add JavaScript code to actually send the email.
  // You’ll likely want to make a POST request to /emails, passing in values for recipients, subject, and body.
  document.querySelector('#compose-form').onsubmit = (e) => {
    e.preventDefault();

    const recipients = document.querySelector('#compose-recipients').value.trim();
    const subject = document.querySelector('#compose-subject').value.trim();
    const body = document.querySelector('#compose-body').value.trim();

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({ recipients, subject, body })
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          alert(data.error || 'Failed to send email.'); //If data.error message is null, the right text will be shown.
          return;
        }
        //Save the success message in the global variable so that it can be shown in a set-mailbox.
        flashMessage = data.message || 'Email sent successfully.';
        load_mailbox('sent');
      })
      .catch((err) => {
        alert('Network error. Please try again.');
        console.error(err);
      });
  };
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //If flashMassage exists, display only onc.
  if (flashMessage) {
    const element = document.createElement('div');
    element.style.color = 'green';
    element.style.margin = '10px 0';
    element.textContent = flashMessage;
    document.querySelector('#emails-view').append(element);
    flashMessage = null;
  }
  //When a mailbox is visited, the application should first query the API for the latest emails in that mailbox.
  fetch(`/emails/${mailbox}`)
    .then(res => res.json())
    .then(emails => {
      emails.forEach(email => {
        const item = document.createElement('div');
        item.className = 'item-box';
        item.dataset.id = email.id;
        item.style.cursor = 'pointer';
        item.style.padding = '8px';
        item.style.border = '1px solid #ddd';
        item.style.marginBottom = '6px';
        item.style.background = email.read ? '#e1e1e1ff' : '#ffffff';
        item.innerHTML = `
          <strong>${mailbox === 'sent' ? email.recipients.join(', ') : email.sender}</strong>
          &nbsp;—&nbsp;${email.subject}
          <span style="float:right;">${email.timestamp}</span>
        `;
        //If the item is clicked, the user can view the email.
        item.addEventListener('click', () => view_email(email.id, mailbox));
        document.querySelector('#emails-view').append(item);
      });
    });
}

function view_email(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  //initializing the innerHTML
  document.querySelector('#email-view').innerHTML = '';

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      // Print email
      console.log(email);

      const content = document.createElement('div');
      content.innerHTML = `
      <p><strong>From: </strong>${email.sender}</p>
      <p><strong>To: </strong>${email.recipients.join(', ')}</p>
      <p><strong>Subject: </strong>${email.subject}</p>
      <p><strong>Timestamp: </strong>${email.timestamp}</p>
      <hr>
      <p style="white-space: pre-wrap;">${email.body}</p>
      <hr>
      `;

      document.querySelector('#email-view').append(content);
      // ... do something else with email ...

      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });

      if (mailbox !== 'sent') {
        const archiveButton = document.createElement('button');
        archiveButton.className = "btn btn-primary";
        archiveButton.textContent = email.archived ? "Unarchive" : "Archive";

        archiveButton.addEventListener('click', () => {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: !email.archived
            })
          }).then(() => {
            load_mailbox('inbox');
          });
        });
        document.querySelector('#email-view').append(archiveButton);
      }

      //creating a reply button. If a user click this button, compose view opens.
      isReply = false;
      const replyButton = document.createElement('button');
      replyButton.className = "btn btn-primary";
      replyButton.textContent = "Reply";
      replyButton.style.marginLeft = '10px';
      replyButton.addEventListener('click', () => {
        isReply = true;
        compose_email(email, isReply);
      });
      document.querySelector(`#email-view`).append(replyButton);
    });
}
