import React from "react";
import { Query } from "react-apollo";
import styled from "styled-components";
import Link from "next/link";
import gql from "graphql-tag";

import Error from "./ErrorMessage";
import OrderItemStyles from "./styles/OrderItemStyles";
import formatMoney from "../lib/formatMoney";
import { formatDistance } from "date-fns";

const USER_ORDERS_QUERY = gql`
  query USER_ORDERS_QUERY {
    orders(orderBy: createdAt_DESC) {
      id
      total
      createdAt
      items {
        id
        title
        price
        description
        quantity
        image
      }
    }
  }
`;

const OrdersList = styled.ul`
  display: grid;
  grid-gap: 4rem;
  grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
`;

class Orders extends React.Component {
  render() {
    return (
      <Query refetch query={USER_ORDERS_QUERY}>
        {({ data: { orders }, loading, error }) => {
          if (error) return <Error error={error} />;
          if (loading) return <p>Loading ...</p>;
          return (
            <div>
              <h2>You have {orders.length} order(s)</h2>
              <OrdersList>
                {orders.map(order => (
                  <OrderItemStyles key={order.id}>
                    <Link
                      href={{
                        pathname: "/order",
                        query: {
                          id: order.id
                        }
                      }}
                    >
                      <a>
                        <div className="order-meta">
                          <p>
                            {order.items.reduce((a, b) => a + b.quantity, 0) &&
                              "Item(s)"}
                          </p>
                          <p>{formatDistance(order.createdAt, new Date())}</p>
                          <p>{formatMoney(order.total)}</p>
                        </div>
                        <div className="images">
                          {order.items.map(item => {
                            return (
                              <img
                                src={item.image}
                                alt={item.title}
                                key={item.id}
                              />
                            );
                          })}
                        </div>
                      </a>
                    </Link>
                  </OrderItemStyles>
                ))}
              </OrdersList>
            </div>
          );
        }}
      </Query>
    );
  }
}

export default Orders;
