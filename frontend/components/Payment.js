import React from "react";
import StripeCheckout from "react-stripe-checkout";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import Router from "next/router";
import NProgress from "nprogress";
import PropTypes from "prop-types";

import calculateTotalPrice from "../lib/calcTotalPrice";
import Error from "./ErrorMessage";
import User, { CURRENT_USER_QUERY } from "./User";
import { TOGGLE_CART_MUTATION } from "./Cart";

const CREATE_ORDER_MUTATION = gql`
  mutation CREATE_ORDER_MUTATION($token: String!) {
    createOrder(token: $token) {
      id
      charge
      total
      items {
        id
        title
      }
    }
  }
`;

function totalItemsInCart(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0);
}

class Payment extends React.Component {
  onTokenReceived = async (response, createOrder) => {
    console.log(response.id);

    NProgress.start();
    // manually call mutation when
    const order = await createOrder({
      variables: {
        token: response.id
      }
    }).catch(error => {
      alert(error.message);
    });

    console.log(order);

    Router.push({
      pathname: "/order",
      query: {
        id: order.data.createOrder.id
      }
    });
  };
  render() {
    return (
      <User>
        {({ data: { me } }) => (
          <Mutation
            mutation={CREATE_ORDER_MUTATION}
            refetchQueries={[{ query: CURRENT_USER_QUERY }]}
          >
            {createOrder => (
              <StripeCheckout
                amount={calculateTotalPrice(me.cart)}
                name="Sick Fits"
                description={`Order of ${totalItemsInCart(me.cart)} item(s)!`}
                image="/static/favicon.png"
                stripeKey="pk_test_KcbZaJaLz4oF8gSi80FFwEMQ00ioWaeQEc"
                currency="USD"
                email={me.email}
                token={res => this.onTokenReceived(res, createOrder)}
              >
                {this.props.children}
              </StripeCheckout>
            )}
          </Mutation>
        )}
      </User>
    );
  }
}

export default Payment;
