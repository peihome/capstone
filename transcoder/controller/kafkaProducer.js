const { producer, topic } = require('./kafkaConfig');

const sendMessage = (message, callback) => {
  if (!message) {
    return callback(new Error('Message is required'));
  }

  const stringifiedMessage = JSON.stringify(message);

  console.log(`Sending message: ${stringifiedMessage} to topic: ${topic}`);

  const payloads = [{ topic, messages: stringifiedMessage }];
  producer.send(payloads, (err, data) => {
    if (err) {
      console.error('Failed to send message:', err);
      return callback(err);
    }
    callback(null, 'Message sent to Kafka successfully');
  });
};

module.exports = { sendMessage };