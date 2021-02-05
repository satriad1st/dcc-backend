const expect = require('chai').expect;
const request = require('supertest');
const server = require('../src/app');
const helpers = require('./helpers');
const BASE_URL_API_V1 = '/api/v1';

describe('App API Endpoint Test', () => {
    it('GET /', async () => {
      const response = await request(server)
        .get('/');
      
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.equal('Welcome to Backend API');    
    });
});
  
describe('User API Tests', () => {
    it('GET /users create new user', async () => {
        let user = await helpers.createUser()
        const response = await request(server)
            .get(`${BASE_URL_API_V1}/users`)
            .set('Authorization', `Bearer ${user.token}`);
        expect(response.statusCode).to.equal(200);
        expect(response.body.users).to.be.an.instanceof(Object);
    });

    it('POST /users create new user', async () => {
        const user = {
            name: 'Keadaton Komputer',
            email: 'kedaton@gmail.com',
            password: '123456',
            phoneNumber: "081224556689"
        };
        const response = await request(server).post(`${BASE_URL_API_V1}/users`).send(user);
        expect(response.statusCode).to.equal(201)
        expect(response.body).to.be.an.instanceof(Object);
        expect(response.body).to.include.keys(['token', 'user']);
        expect(response.body.user).to.include({
            name: 'Keadaton Komputer',
            email: 'kedaton@gmail.com',
        });
    });

    it('POST /users/ create new user validation', async () => {
        const response = await request(server).post(`${BASE_URL_API_V1}/users`).send({});
        expect(response.statusCode).to.equal(422)
    });

    it('POST /users/login success login', async () => {
        const response = await request(server).post(`${BASE_URL_API_V1}/users/login`).send({
            email: 'kedaton@gmail.com',
            password: '123456'
        });
        expect(response.statusCode).to.equal(200);
        expect(response.body.user).to.include({
            email: 'kedaton@gmail.com'
        });
    });

    it('POST /users/login invalid login credentials', async () => {
        const response = await request(server).post(`${BASE_URL_API_V1}/users/login`).send({
            email: 'kedaton@gmail.com',
            password: 'xxx'
        });
        expect(response.statusCode).to.equal(401)
        expect(response.body.error).to.equal('Login failed! Check authentication credentials')
    });

    it('GET /users/me Unauthorized access', async () => {
        const response = await request(server).get(`${BASE_URL_API_V1}/users/me`);
        expect(response.statusCode).to.equal(401)
    });

    it('GET /users/me Can access profile', async () => {
        let user = await helpers.createUser()
        const response = await request(server)
            .get(`${BASE_URL_API_V1}/users/me`)
            .set('Authorization', `Bearer ${user.token}`);
        expect(response.statusCode).to.equal(200);
        expect(response.body).to.include({
            name: user.user.name,
            email: user.user.email,
        });
    });
});

/**
 * Run once after all tests finish
 * 
 * Not allowed to delete the database in MongoDB Atlas
 * This function used in development mode
 */
after(function (done) {    
    // const mongoose = require('mongoose');
    console.log('Deleting test database');
    done();
    // mongoose.connection.db.dropDatabase(done);
});