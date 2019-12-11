import React from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import { adopt } from "react-adopt";

import User from "./User";
import CartStyles from "./styles/CartStyles";
import Supreme from "./styles/Supreme";
import CloseButton from "./styles/CloseButton";
import SickButton from "./styles/SickButton";
import CartItem from "./CartItem";
import calcTotalPrice from "../lib/calcTotalPrice";
import formatMoney from "../lib/formatMoney";
import Payment from "./Payment";

const LOCAL_STATE_QUERY = gql`
  query {
    cartOpen @client
  }
`;

const TOGGLE_CART_MUTATION = gql`
  mutation {
    toggleCart @client
  }
`;

const Composed = adopt({
  user: ({ render }) => <User>{render}</User>,
  toggleCart: ({ render }) => (
    <Mutation mutation={TOGGLE_CART_MUTATION}>{render}</Mutation>
  ),
  localState: ({ render }) => <Query query={LOCAL_STATE_QUERY}>{render}</Query>
});

const Cart = () => (
  <Composed>
    {({ user, toggleCart, localState }) => {
      const me = user.data.me;
      if (!me) return null;
      return (
        <CartStyles open={localState.data.cartOpen}>
          <header>
            <CloseButton onClick={toggleCart} title="close">
              &times;
            </CloseButton>
            <Supreme>{me.name}'s Cart</Supreme>
            <p>
              {`You have ${
                me.cart.length === 0
                  ? "no items"
                  : me.cart.length === 1
                  ? `${me.cart.length} item`
                  : `${me.cart.length} items`
              }
              in your cart`}
            </p>
          </header>
          <ul>
            {me.cart.map(cartItem => (
              <CartItem cartItem={cartItem} key={cartItem.id} />
            ))}
          </ul>
          {me.cart && me.cart.length && (
            <footer>
              <p>{formatMoney(calcTotalPrice(me.cart))}</p>

              <Payment>
                <SickButton>Checkout</SickButton>
              </Payment>
            </footer>
          )}
        </CartStyles>
      );
    }}
  </Composed>
);

export default Cart;
export { LOCAL_STATE_QUERY, TOGGLE_CART_MUTATION };
