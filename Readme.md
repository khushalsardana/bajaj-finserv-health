Note: Since the backend Express server serves the static frontend assets directly (using `express.static`), both the API and the Frontend share the same hosted URL. This keeps the setup simple and prevents any CORS issues.


This project is hosted on a Render Free Instance. 

* If the application has been inactive, the server will "sleep". 
* When loading the hosted Frontend URL or sending the first POST request, please allow up to 45–60 seconds for the container to wake up (cold-start).
* If you see a connection error initially, simply reload the page or wait a short moment and try again. Once the container is active, requests will respond instantly.


## Local Setup

### Backend & Frontend
1. Navigate to `backend` directory:

   cd backend


2. Install dependencies:

   npm install


3. Set your credentials in `.env` (copy from `.env.example`). I have given the credentials I used to create it in the `.env` file. I know its not a good practice but for the sake of submission I am doing this.

4. Start the server:

   npm start


5. Open `http://localhost:5000/` in your browser.
