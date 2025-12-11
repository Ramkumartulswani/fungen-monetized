import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
export default function GeneratorCard({text,onCopy,onRegenerate}){
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.row}>
        <TouchableOpacity onPress={onCopy} style={styles.btn}><Text>Copy</Text></TouchableOpacity>
        <TouchableOpacity onPress={onRegenerate} style={styles.btn}><Text>Regenerate</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const styles=StyleSheet.create({card:{padding:16,borderRadius:8,backgroundColor:'#fff',margin:12,elevation:2},text:{fontSize:16},row:{flexDirection:'row',justifyContent:'space-between',marginTop:12},btn:{padding:8}});
