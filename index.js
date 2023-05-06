const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://
${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vp86zhc.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const appointmentCollection = client
      .db("doctors-portal")
      .collection("AppointmentsOption");
    const BookingCollection = client
      .db("doctors-portal")
      .collection("bookings");
      const usersCollection = client
      .db("doctors-portal")
      .collection("users");

    // Use aggregate to query multiple collection and then marge data
    app.get("/appointmentsOption", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentCollection.find(query).toArray();

      //get the bookings of the provided date
      const bookingquery = { appointmentDate: date };
      const allreadyBooked = await BookingCollection.find(
        bookingquery
      ).toArray();

      //code carefully XD
      options.forEach((option) => {
        const optionBooked = allreadyBooked.filter(
          (book) => book.treatment === option.name
        );
        const bookSlots = optionBooked.map((book) => book.slot);
        const remainingSlots = option.slots.filter(
          (slot) => !bookSlots.includes(slot)
        );
        option.slots = remainingSlots;
        console.log(option.name, remainingSlots.length);
      });
      res.send(options);
    });

    // app.get("/v2/appointmentsOption", async (req, res) => {
    //   const date = req.query.date;
    //   const options = await appointmentCollection.aggregate([
    //     {
    //       $lookup: {
    //         from: "bookings",
    //         localField: "name",
    //         foreignField: "treatment",
    //         pipeline: [
    //           {
    //             $match: {
    //               $expr: {
    //                 $eq: ["$appointmentDate", date],
    //               },
    //             },
    //           },
    //         ],
    //         as: "booked",
    //       },
    //     },
    //     {
    //       $project: {
    //         name: 1,
    //         slots: 1,
    //         booked: {
    //           $map: {
    //             input: "$booked",
    //             as: "book",
    //             in: "$book.slot",
    //           },
    //         },
    //       },
    //     },
    //   ]).toArray();
    //   res.send(options);
    // });

    // * ------API Naming Convenetion------
    // * app.get('/bookings')
    // * app.get('/bookings/:id')
    // * app.post('/bookings')
    // * app.patch('/bookingd/:id')
    // * app.delete('/bookingd/:id')

    app.get('/bookings', async (req, res) =>{
      const email = req.query.email;
      const query = { email: email};
      const bookings = await BookingCollection.find(query).toArray();
      res.send(bookings);

    })

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
          appointmentDate: booking.appointmentDate,
          email: booking.email,
          treatment: booking.treatment
      }

      const alreadyBooked = await BookingCollection.find(query).toArray();

      if (alreadyBooked.length) {
          const message = `You already have a booking on ${booking.appointmentDate}`
          return res.send({ acknowledged: false, message })
      }

      const result = await BookingCollection.insertOne(booking);
      res.send(result);
  });

  app.post('/users', async (req, res) => {
    const user = req.body;
    console.log(user);
    const result = await usersCollection.insertOne(user);
    res.send(result);
    console.log(result);
});


  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("doctors portal server is running");
});

app.listen(port, () => console.log(`Doctors Portal running on ${port}`));
