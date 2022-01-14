# HTML Is A Programming Language

An extension to HTML to end the eternal discusion

## Language Overview

To avoid introducing a parser for arithmetic/comparison/logic expressions I did
what any sensible person would do, create a stack language hybrid.

### literals

#### Numbers

`1`, `2`, `42`

#### Booleans

`true`, `false`

#### Variables

`$foo`, `$bar`

#### Strings

Anything that is not other literal value is considered a string, no quotes needed

## Language Constructs

### v

Put the value in the document

Example: put the value of variable `$i` in the document

`<v $i></v>`

### let

Binds variables to values (see literals above), for example:

```html
<let s=hello n=4 b=true v=$s>
 <p>String: <v $s></v></p>
 <p>Number: <v $n></v></p>
 <p>Boolean: <v $b></v></p>
 <p>Variable: <v $v></v></p>
</let>
```

Will generate:

```html
String: hello

Number: 4

Boolean: true

Variable: hello
```

### cond

Evaluate conditions in order, return the body of the first that matches or `else` if
present and no other `if` matches

```html
<cond>
  <if $isMod3AndMod4><p>FizzBuzz</p></if>

  <if $isMod3><p>Fizz</p></if>

  <if $isMod4><p>Buzz</p></if>

  <else><p><v $i></v></p></else>
</cond>
```

Note: any other HTML tags or expressions are evaluated if present inside `cond` until
the first if/else match, for example:

```html
<cond>
  <do calc-is-mod $i 3></do>
  <do set isMod3></do>

  <do calc-is-mod $i 4></do>
  <do set isMod4></do>

  <do push $isMod3></do>
  <do push $isMod4></do>
  <do and></do>
  <do set isMod3AndMod4></do>

  <if $isMod3AndMod4><p>FizzBuzz</p></if>

  <if $isMod3><p>Fizz</p></if>

  <if $isMod4><p>Buzz</p></if>

  <else><p><v $i></v></p></else>
</cond>
```

### if

Embed the tag's body if the condition evaluates to true.

Note: can be used inside cond where if true stops evaluating conditions (like if/else
if) or outside where it works like a single if without else if/else branches.

### else

Embed the tag's body if the tag is reached inside a `cond` tag.

Note: if used outside a `cond` it will always embed its body.

### for

Binds each item in an iterator to a variable and embeds the body of the `for` tag
as many times as items in the iterator with the item bound to the provided variable.

```html
<do range $from $to></do>
<do set nums></do>
<for i in $nums>
 <v $i></v>
</for>
```

### defn

Define a function that can later be called with the `do` tag.

```html
<defn calc-is-mod i n>
 <do push $i></do>
 <do push $n></do>
 <do rem></do>
 <do push 0></do>
 <do eq></do>
</defn>
```

### do

Call a function with a name and 0 or more parameters

Push value in variable `$i` to the stack: `<do push $i></do>`
Push number 3 to the stack: `<do push 3></do>`
Call reminder (takes 2 values from the stack and pushes the result): `<do rem></do>`

Call user defined function `calc-is-mod` passing variable `$i` and number `3` as parameter: `<do calc-is-mod $i 3></do>`

### nb

A [comment](https://dictionary.cambridge.org/dictionary/english/nb) whose body is logged to the console

`<nb>i = <v $i></v> i % 3 == 0? <v $isMod3></v></nb>` will print something like `i =  1  i % 3 == 0?  false` to the console

## Examples

### Simple Fizzbuzz

```html
<do range 1 15></do>
<do set nums></do>
<for i in $nums>
 <do push $i></do>
 <do push 3></do>
 <do rem></do>
 <do push 0></do>
 <do eq></do>
 <do set isMod3></do>
 <nb>i = <v $i></v> i % 3 == 0? <v $isMod3></v></nb>

 <do push $i></do>
 <do push 4></do>
 <do rem></do>
 <do push 0></do>
 <do eq></do>
 <do set isMod4></do>
 <nb>i = <v $i></v> i % 4 == 0? <v $isMod4></v></nb>

 <do push $isMod3></do>
 <do push $isMod4></do>
 <do and></do>
 <do set isMod3AndMod4></do>
 <nb>i = <v $i></v> i % 3 == 0 and i % 4 == 0? <v $isMod3AndMod4></v></nb>

 <cond>
     <if $isMod3AndMod4><p>FizzBuzz</p></if>

     <if $isMod3><p>Fizz</p></if>

     <if $isMod4><p>Buzz</p></if>

     <else><p><v $i></v></p></else>
 </cond>
</for>
```

### Fizzbuzz with Functions

```html
<defn calc-is-mod i n>
  <do push $i></do>
  <do push $n></do>
  <do rem></do>
  <do push 0></do>
  <do eq></do>
</defn>

<defn fizzbuzz from to>
  <do range $from $to></do>
  <do set nums></do>
  <for i in $nums>
    <do calc-is-mod $i 3></do>
    <do set isMod3></do>
    <nb>i = <v $i></v> i % 3 == 0? <v $isMod3></v></nb>

    <do calc-is-mod $i 4></do>
    <do set isMod4></do>
    <nb>i = <v $i></v> i % 4 == 0? <v $isMod4></v></nb>

    <do push $isMod3></do>
    <do push $isMod4></do>
    <do and></do>
    <do set isMod3AndMod4></do>
    <nb>i = <v $i></v> i % 3 == 0 and i % 4 == 0? <v $isMod3AndMod4></v></nb>

    <cond>
      <if $isMod3AndMod4><p>FizzBuzz</p></if>

      <if $isMod3><p>Fizz</p></if>

      <if $isMod4><p>Buzz</p></if>

      <else><p><v $i></v></p></else>
    </cond>
  </for>
</defn>

<do fizzbuzz 1 21></do>
<do pop></do>
```

### Counter

A counter with two buttons, one to increment and one to decrement, the counter markup
is:

```html
<button id=dec>-</button>
<input type=number readonly id=counter value=0>
<button id=inc>+</button>
```

```html
<defn on-dec-click e>
 <do on-btn-click e dec></do>
</defn>

<defn on-inc-click e>
 <do on-btn-click e inc></do>
</defn>

<defn on-btn-click e op>
  <do query-selector-id counter></do>
  <do set input></do>

  <do get-attribute $input value></do>
  <do set cur-count-raw></do>

  <do parse-int $cur-count-raw></do>
  <!-- higher order functions :P -->
  <do $op></do>
  <do set new-count></do>

  <do set-attribute $input value $new-count></do>
</defn>

<do add-event-listener-id dec click on-dec-click></do>
<do add-event-listener-id inc click on-inc-click></do>
```

## Author

- [Mariano Guerra](https://marianoguerra.github.io/)
- [@warianoguerra](https://twitter.com/warianoguerra)
- [@marianoguerra@vis.social](https://vis.social/@marianoguerra)

## License

MIT
