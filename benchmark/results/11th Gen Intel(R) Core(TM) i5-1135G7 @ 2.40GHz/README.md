# Benchmark of `nestia`
> - CPU: 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz
> - Memory: 16,218 MB
> - OS: win32
> - NodeJS version: v16.20.0
> - Nestia version: v1.3.8


## assert
![assert benchmark](images/assert.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 47 | 65 | 63 | 3.99 | 4.15 
 object (hierarchical) | 109 | 109 | 105 | 7.92 | 8.61 
 object (recursive) | 111 | 110 | 103 | 6.82 | 6.75 
 object (union, explicit) | 69 | 71 | 43 | 2.81 | 2.86 
 array (simple) | 96 | 103 | 99 | 6.64 | 6.64 
 array (hierarchical) | 115 | 95 | 95 | 5.53 | 5.53 
 array (recursive) | 105 | 97 | 95 | 6.12 | 5.93 
 array (union, explicit) | 121 | 111 | 73 | 5.86 | 5.63 

> Unit: Megabytes/sec




## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 60 | 132 | 106 | 7.63 | 8.42 
 object (hierarchical) | 133 | 186 | 146 | 15 | 16 
 object (recursive) | 146 | 183 | 74 | 14 | 14 
 object (union, explicit) | 99 | 117 | 64 | 6.32 | 6.44 
 array (simple) | 104 | 138 | 104 | 14 | 15 
 array (hierarchical) | 155 | 156 | 71 | 13 | 13 
 array (recursive) | 132 | 144 | 92 | 13 | 13 
 array (union, explicit) | 117 | 131 | 31 | 15 | 15 

> Unit: Megabytes/sec




## performance
![performance benchmark](images/performance.svg)

 Types | nestia-express | nestia-fastify | fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------|------
 object (simple) | 66 | 100 | 92 | 7.71 | 8.16 
 object (hierarchical) | 122 | 152 | 123 | 15 | 16 
 object (recursive) | 122 | 143 | 89 | 13 | 13 
 object (union, explicit) | 76 | 90 | 53 | 2.90 | 2.90 
 array (simple) | 101 | 114 | 116 | 6.44 | 6.93 
 array (hierarchical) | 118 | 119 | 83 | 5.73 | 5.42 
 array (recursive) | 110 | 117 | 101 | 12 | 11 
 array (union, explicit) | 117 | 120 | 42 | 5.76 | 5.78 

> Unit: Megabytes/sec







Total elapsed time: 1,391,591 ms
