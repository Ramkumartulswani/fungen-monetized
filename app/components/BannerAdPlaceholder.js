import React from 'react'; import {View,Text,StyleSheet} from 'react-native';
export default function BannerAdPlaceholder(){ return (<View style={styles.box}><Text>Ad Banner Placeholder</Text></View>); }
const styles=StyleSheet.create({box:{height:60,alignItems:'center',justifyContent:'center',backgroundColor:'#eee'}});
