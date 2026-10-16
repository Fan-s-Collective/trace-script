<template>
  <Widget title='a > b < c &quot; d'
    :[key.replace('a','b')]="value"
    :data="{ first: 1,
      second: 2 }" />
  <option v-for="option in options" :key="option" :value="option">{{ option === 'all' ? allLabel : option }}</option>
</template>
