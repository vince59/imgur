import * as React from 'react';
import {
  ActivityIndicator,
  Button,
  StatusBar,
  StyleSheet,
  View,
  AsyncStorage,
  ScrollView,
  Image,
  Text
} from 'react-native';
import CookieManager from 'react-native-cookies';
import { createSwitchNavigator, createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { ListItem, SearchBar } from 'react-native-elements';

class SignInScreen extends React.Component {
  static navigationOptions = {
    title: 'Please sign in',
  };

  render() {
    return (
      <WebView onNavigationStateChange={this._signInAsync}
        source={{ uri: 'https://api.imgur.com/oauth2/authorize?client_id=68822c8af5d38d9&response_type=token' }}
      />
    );
  }

  _signInAsync = async (navigationState: WebViewNavigation) => {
    const url = navigationState.url.replace("#", "?");
    let regex = /[?&]([^=#]+)=([^&#]*)/g,
      params = {},
      match
    while ((match = regex.exec(url))) {
      params[match[1]] = match[2]
    }

    if (params.access_token) {
      await AsyncStorage.setItem('userToken', params.access_token);
      this.props.navigation.navigate('App');
    }
  };
}

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Epicture',
  };

  render() {
    const list = [
      {
        title: 'Photo from my account',
        icon: 'camera-enhance',
        onPress: this._showPhoto
      },
      {
        title: 'Search from Imgur',
        icon: 'find-in-page',
        onPress: this._searchPhoto
      },
      {
        title: 'Sign out',
        icon: 'clear',
        onPress: this._signOutAsync
      },
    ]
    return (
      <>
        <Button title="Menu" />
        {
    list.map((item, i) => (
      <ListItem
        key={i}
        title={item.title}
        leftIcon={{ name: item.icon }}
        onPress={item.onPress} 
        bottomDivider
        chevron
      />
    ))
  }
      </>
    );
  }

  _showPhoto = () => {
    this.props.navigation.navigate('Photo');
  };

  _searchPhoto = () => {
    this.props.navigation.navigate('Search');
  };

  _signOutAsync = async () => {
    await AsyncStorage.clear();
    await CookieManager.clearAll();
    this.props.navigation.navigate('Auth');
  };
}

class PhotoScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: []
    };
  }

  static navigationOptions = {
    title: 'Your photos',
  };

  componentDidMount() {
    AsyncStorage.getItem('userToken').then((value) => {
      fetch("https://api.imgur.com/3/account/me/images", {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + value,
        },
        method: "GET"
      })
      .then(response => response.json())
      .then(data => {
        this.setState({ images: data.data });
      })
      .catch(function (res) { console.error(res) })
    })

  }

  render() {
    return (<>
        <ScrollView>{this.state.images.map(i =>
          <Image style={{ width: 200, height: 200 }} source={{ uri: i.link }} />)}
        </ScrollView>
        <StatusBar barStyle="default" />
      </>
    );
  }
}

class SearchScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      search: ''
    };
  }

  static navigationOptions = {
    title: 'Search',
  };

  updateSearch = search => {
    let s= { search };

    //console.error();
    AsyncStorage.getItem('userToken').then((value) => {
      fetch("https://api.imgur.com/3/gallery/search?q=title: "+s.search+" ext: png", {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + value,
        },
        method: "GET"
      })
      .then(response => response.json())
      .then(data => {
        this.setState({ search });
        this.setState({ images: data.data });
        //console.error(this.state);
      })
      .catch(function (res) { console.error(res) })
  
    })
  };

  render() {
    const { search } = this.state;
    return (
      <>
      <SearchBar
        placeholder="Type Here..."
        onChangeText={this.updateSearch}
        value={search}
      />
      <ScrollView>{this.state.images.map(i =>{ 
        if (i.link.slice(i.link.length - 3)=="png") 
      return <Image style={{ width: 200, height: 200 }} source={{ uri: i.link }} />})}
        </ScrollView>
      </>
    );
  }
}

class AuthLoadingScreen extends React.Component {
  constructor() {
    super();
    this._bootstrapAsync();
  }

  _bootstrapAsync = async () => {
    const userToken = await AsyncStorage.getItem('userToken');
    this.props.navigation.navigate(userToken ? 'App' : 'Auth');
  };

  render() {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
        <StatusBar barStyle="default" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const AppStack = createStackNavigator({ Home: HomeScreen, Photo: PhotoScreen, Search: SearchScreen });
const AuthStack = createStackNavigator({ SignIn: SignInScreen });

export default createAppContainer(createSwitchNavigator(
  {
    AuthLoading: AuthLoadingScreen,
    App: AppStack,
    Auth: AuthStack,
  },
  {
    initialRouteName: 'AuthLoading',
  }
));
