import { query } from 'faunadb'

import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'

import { fauna } from '../../../services/fauna'

export default NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user'
        }
      }
    })
  ],

  callbacks: {
    async session({ session }) {
      try {
        const userActiveSubscription = await fauna.query(
          query.Get(
            query.Intersection([
              query.Match(
                query.Index('subscription_by_user_ref'),
                query.Select(
                  'ref',
                  query.Get(
                    query.Match(
                      query.Index('user_by_email'),
                      query.Casefold('session.user.email')
                    )
                  )
                )
              ),
              query.Match(query.Index('subscription_by_status'), 'active')
            ])
          )
        )
        return {
          ...session,
          activeSubscription: userActiveSubscription,
          expires: 'never'
        }
      } catch {
        return {
          ...session,
          activeSubscription: null,
          expires: 'never'
        }
      }
    },

    async signIn({ user, account, profile }) {
      const { email } = user

      try {
        await fauna.query(
          query.If(
            query.Not(
              query.Exists(
                query.Match(
                  query.Index('user_by_email'),
                  query.Casefold(user.email)
                )
              )
            ),
            query.Create(query.Collection('users'), { data: { email } }),
            query.Get(
              query.Match(
                query.Index('user_by_email'),
                query.Casefold(user.email)
              )
            )
          )
        )
        return true
      } catch (err) {
        console.log(err)
        return false
      }
    }
  }
})