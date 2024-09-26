const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
    contactPoints: [process.env.ec2_cassandra_host],
    localDataCenter: process.env.ec2_cassandra_dc,
    protocolOptions: { port: process.env.ec2_cassandra_port },
});

client.connect()
    .then(() => console.log('Connected to Cassandra'))
    .catch(err => console.error('Error connecting to Cassandra', err));

client.execute(`USE ${process.env.ec2_cassandra_db}`);

module.exports = {
    client
}