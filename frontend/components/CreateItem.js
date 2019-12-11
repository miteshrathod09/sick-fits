import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import Form from "./styles/Form";
import formatMoney from "../lib/formatMoney";
import Error from "../components/ErrorMessage";
import Router from "next/router";

const CREATE_ITEM_MUTATION = gql`
  mutation CREATE_ITEM_MUTATION(
    $title: String!
    $description: String!
    $price: Int!
    $image: String
    $largeImage: String
  ) {
    createItem(
      title: $title
      description: $description
      price: $price
      image: $image
      largeImage: $largeImage
    ) {
      id
    }
  }
`;

class CreateItem extends Component {
  state = {
    title: "",
    description: "",
    image: "",
    largeImage: "",
    price: 0
  };

  handleChange = e => {
    const { name, type, value } = e.target;
    const val = type === "number" ? parseFloat(value) : value;
    this.setState({
      [name]: val
    });
  };

  uploadFile = async e => {
    const files = e.target.files;
    const data = new FormData();
    data.append("file", files[0]);
    data.append("upload_preset", "sickfits");
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/ddajkgblh/image/upload",
      {
        method: "POST",
        body: data
      }
    );
    const file = await res.json();
    this.setState({
      image: file.secure_url,
      largeImage: file.eager[0].secure_url
    });
  };

  render() {
    return (
      <Mutation
        // refetchQueries={}
        mutation={CREATE_ITEM_MUTATION}
        variables={this.state}
      >
        {(createItem, { loading, error }) => (
          <Form
            onSubmit={async e => {
              // stop form submission
              e.preventDefault();
              // call mutation
              const res = await createItem();
              // take them to item page
              Router.push({
                pathname: "/item",
                query: {
                  id: res.data.createItem.id
                }
              });
            }}
          >
            <Error error={error}></Error>
            <fieldset disabled={loading} aria-busy={loading}>
              <label htmlFor="file">
                Title
                <input
                  type="file"
                  id="file"
                  name="file"
                  placeholder="Upload a file"
                  required
                  onChange={this.uploadFile}
                />
              </label>
              {this.state.image && (
                <img src={this.state.image} alt="Image Preview" />
              )}
              <label htmlFor="title">
                Title
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Enter a title"
                  value={this.state.title}
                  required
                  onChange={this.handleChange}
                />
              </label>
              <label htmlFor="price">
                Price
                <input
                  type="number"
                  id="price"
                  name="price"
                  placeholder="Enter a price"
                  value={this.state.price}
                  required
                  onChange={this.handleChange}
                />
              </label>
              <label htmlFor="description">
                Description
                <textarea
                  type="text"
                  id="description"
                  name="description"
                  placeholder="Enter a description"
                  value={this.state.description}
                  required
                  onChange={this.handleChange}
                ></textarea>
              </label>
              <button type="submit">Submit</button>
            </fieldset>
          </Form>
        )}
      </Mutation>
    );
  }
}

export default CreateItem;
export { CREATE_ITEM_MUTATION };
