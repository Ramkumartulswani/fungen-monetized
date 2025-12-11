import React, {useState, useEffect} from 'react';
import {View, Text, Button, Alert, ScrollView} from 'react-native';
import GeneratorCard from '../components/GeneratorCard';
import BannerAdPlaceholder from '../components/BannerAdPlaceholder';
import {getRandomItem} from '../services/generatorService';
import {saveLastGenerated, getLastGenerated} from '../services/storageService';
export default function HomeScreen({navigation}) {
  const [text, setText] = useState('');
  useEffect(()=>{ (async ()=>{ const last = await getLastGenerated(); if(last) setText(last); else handleGenerate(); })(); }, []);
  const handleGenerate = async ()=>{ const item = getRandomItem(); setText(item); await saveLastGenerated(item); };
  const handleCopy = ()=>{ Alert.alert('Copied','Text copied to clipboard'); };
  return (
    <ScrollView contentContainerStyle={{padding:16}}>
      <GeneratorCard text={text} onCopy={handleCopy} onRegenerate={handleGenerate} />
      <BannerAdPlaceholder />
      <View style={{marginTop:16}}><Button title="Settings" onPress={()=>navigation.navigate('Settings')} /></View>
    </ScrollView>
  );
}
