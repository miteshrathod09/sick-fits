import React from "react";
import Downshift, { resetIdCounter } from "downshift";
import Router from "next/router";
import { ApolloConsumer } from "react-apollo";
import gql from "graphql-tag";
import debounce from "lodash.debounce";

import { DropDown, DropDownItem, SearchStyles } from "./styles/DropDown";

const SEARCH_ITEMS_QUERY = gql`
  query SEARCH_ITEMS_QUERY($searchItem: String!) {
    items(
      where: {
        OR: [
          { title_contains: $searchItem }
          { description_contains: $searchItem }
        ]
      }
    ) {
      id
      image
      title
    }
  }
`;

function routeToItem(item) {
  Router.push({
    pathname: "/item",
    query: {
      id: item.id
    }
  });
}

class Search extends React.Component {
  state = {
    items: [],
    loading: false
  };

  onChange = debounce(async (e, client) => {
    if (!e.target.value) {
      return;
    }
    this.setState({
      loading: true
    });
    const response = await client.query({
      query: SEARCH_ITEMS_QUERY,
      variables: {
        searchItem: e.target.value
      }
    });

    this.setState({
      items: response.data.items,
      loading: false
    });
  }, 350);

  render() {
    resetIdCounter();
    return (
      <SearchStyles>
        <Downshift
          onChange={routeToItem}
          itemToString={item => (item === null ? "" : item.title)}
        >
          {({
            getInputProps,
            getItemProps,
            isOpen,
            inputValue,
            highlightedIndex
          }) => (
            <div>
              <ApolloConsumer>
                {client => (
                  <input
                    {...getInputProps({
                      type: "search",
                      placeholder: "Search for an item",
                      id: "search",
                      className: this.state.loading ? "loading" : "",
                      onChange: e => {
                        e.persist();
                        this.onChange(e, client);
                      }
                    })}
                  />
                )}
              </ApolloConsumer>
              {isOpen && inputValue && (
                <DropDown>
                  {this.state.items.map((item, index) => (
                    <DropDownItem
                      {...getItemProps({ item })}
                      highlighted={index === highlightedIndex}
                      key={item.id}
                    >
                      <img src={item.image} alt={item.title} width="50" />
                      {item.title}
                    </DropDownItem>
                  ))}

                  {!this.state.items.length && !this.state.loading && (
                    <DropDownItem>
                      Nothing found for search term "{inputValue}"
                    </DropDownItem>
                  )}
                </DropDown>
              )}
            </div>
          )}
        </Downshift>
      </SearchStyles>
    );
  }
}

export default Search;
