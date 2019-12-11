import React from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import gql from "graphql-tag";

import { CURRENT_USER_QUERY } from "./User";
import { Mutation } from "react-apollo";

const REMOVE_FROM_CART_MUTATION = gql`
  mutation REMOVE_FROM_CART_MUTATION($id: ID!) {
    removeFromCart(id: $id) {
      id
    }
  }
`;

const DeleteButton = styled.button`
  font-size: 3rem;
  background: none;
  border: 0;
  &:hover {
    color: ${props => props.theme.red};
    cursor: pointer;
  }
`;

class RemoveFromCart extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired
  };
  update = (cache, payload) => {
    // read cache
    const data = cache.readQuery({
      query: CURRENT_USER_QUERY
    });
    // remove item from cart
    const cartItemId = payload.data.removeFromCart.id;
    // write back
    data.me.cart = data.me.cart.filter(cartItem => cartItem.id != cartItemId);
    cache.writeQuery({
      query: CURRENT_USER_QUERY,
      data
    });
  };
  render() {
    return (
      <Mutation
        update={this.update}
        optimisticResponse={{
          __typename: "Mutation",
          removeFromCart: {
            __typename: "CartItem",
            id: this.props.id
          }
        }}
        variables={{
          id: this.props.id
        }}
        mutation={REMOVE_FROM_CART_MUTATION}
      >
        {(removeFromCart, { loading, error }) => (
          <DeleteButton
            disabled={loading}
            onClick={() => {
              removeFromCart().catch(err => alert(err.message));
            }}
            title="Delete Item"
          >
            &times;&nbsp;&nbsp;&nbsp;&nbsp;
          </DeleteButton>
        )}
      </Mutation>
    );
  }
}

export default RemoveFromCart;
