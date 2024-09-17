const { KafkaClient, Producer, Consumer } = require('kafka-node');
const { transcodeVideo } = require('./transcodeVideo');

const kafkaHost = process.env.kafka_HOST;
const kafkaPort = process.env.kafka_PORT;
const topic = process.env.kafka_transcoder_TOPIC;

const client = new KafkaClient({ kafkaHost: `${kafkaHost}:${kafkaPort}` });

// Producer Handling Starts
const producer = new Producer(client);
producer.on('ready', () => {
  console.log('Producer is ready');
});

producer.on('error', (err) => {
  console.error('Producer error:', err);
});
// Producer Handling Ends


//Consumer Handling Starts
const consumer = new Consumer(
  client,
  [{ topic }],
  { autoCommit: true }
);

consumer.on('error', (err) => {
  console.error('Consumer error:', err);
});

consumer.on('message', async (message) => {
  console.log('Received Kafka message:', message.value);
  
  try {
    await transcodeVideo(message.value); // Perform transcoding
    console.log('Transcoding Completed for ' + message.value);
  } catch (err) {
    console.log('Transcoding Failed for ' + message.value);
  }
});
//Consumer Handling Ends

module.exports = { producer, consumer, topic };