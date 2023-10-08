//import Form from "./components/form"
import './App.css';
import { API, graphqlOperation, Auth } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from 'aws-amplify';
import React, { useState, useEffect, useReducer, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Col, Container, Form, Row, Table } from 'react-bootstrap';

import config from './aws-exports';
import { createRestaurant } from './graphql/mutations';
import { listRestaurants } from './graphql/queries';
import { onCreateRestaurant } from './graphql/subscriptions';

Amplify.configure(config);

const initialState = {
  restaurants: [],
  formData: {
    name: '',
    city: '',
    description: '',
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'QUERY':
      return { ...state, restaurants: action.payload };
    case 'SUBSCRIPTION':
      return { ...state, restaurants: [...state.restaurants, action.payload] };
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    default:
      return state;
  }
};

function App({ signOut }) {
  const [user, setUser] = useState(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [inputError, setInputError] = useState("")

  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(user => setUser(user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    getRestaurantList();

    const subscription = API.graphql(graphqlOperation(onCreateRestaurant)).subscribe({
      next: eventData => {
        const payload = eventData.value.data.onCreateRestaurant;
        dispatch({ type: 'SUBSCRIPTION', payload });
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  const getRestaurantList = async () => {
    const restaurants = await API.graphql(graphqlOperation(listRestaurants));
    dispatch({
      type: 'QUERY',
      payload: restaurants.data.listRestaurants.items,
    });
  };

  const createNewRestaurant = async e => {
    e.stopPropagation();

    const { name, description, city } = state.formData;
    if (name && description && city) {
      console.log("good")
      const restaurant = {
        name,
        description,
        city,
      };
      await API.graphql(graphqlOperation(createRestaurant, { input: restaurant }));
      dispatch({
        type: ""
      })

    } else {
      setInputError("Form need to be completed")
      dispatch({
        type: ""
      })


    }


  };

  const handleChange = e => {
    setName(e.target.value)
    setCity(e.target.value)
    setDescription(e.target.value)
    dispatch({
      type: 'SET_FORM_DATA',
      payload: { [e.target.name]: e.target.value },
    });

  }

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="App">
      <Container>
        <Row className="mt-3">
          <Col md={4}>
            {inputError && <p className='err'>{inputError}</p>}
            <Form>
              <Form.Group controlId="formDataName" className='mtop'>
                <Form.Control onChange={handleChange} type="text" name="name" placeholder="Name" />
              </Form.Group>
              <Form.Group controlId="formDataDescription" className='mtop'>
                <Form.Control onChange={handleChange} type="text" name="description" placeholder="Description" />
              </Form.Group>
              <Form.Group controlId="formDataCity" className='mtop'>
                <Form.Control onChange={handleChange} type="text" name="city" placeholder="City" />
              </Form.Group>
              <Button onClick={createNewRestaurant} className="float-left">
                Add New Restaurant
              </Button>
              {user && (
                <Button onClick={handleSignOut} className="float-right">
                  Sign Out
                </Button>
              )}
            </Form>
          </Col>
        </Row>

        {state.restaurants.length ? (
          <Row className="my-3">
            <Col>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>City</th>
                  </tr>
                </thead>
                <tbody>
                  {state.restaurants.map((restaurant, index) => (
                    <tr key={`restaurant-${index}`}>
                      <td>{index + 1}</td>
                      <td>{restaurant.name}</td>
                      <td>{restaurant.description}</td>
                      <td>{restaurant.city}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        ) : null}
      </Container>
    </div>
  );

}

export default withAuthenticator(App);
